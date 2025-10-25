import moment from "moment";

export const calculateDates = (issuanceDate, surveyName, existingSurveys = []) => {
    if (!issuanceDate) return { dueDate: "", rangeFrom: "", rangeTo: "", anniversaryDate: "" };

    const issuanceDateObj = moment(issuanceDate);

    const addYears = (date, years) => date ? moment(date).add(years, "years") : null;
    const addMonths = (date, months) => date ? moment(date).add(months, "months") : null;
    const formatDate = (date) => date && moment(date).isValid() ? moment(date).format("YYYY-MM-DD") : "";

    // Normalize names: trims, lowercase, single space
    const normalizeName = (name) => name?.trim().toLowerCase().replace(/\s+/g, " ");

    const findSurveyByName = (name) => existingSurveys.find(
        (s) => normalizeName(s.surveyName) === normalizeName(name) && (s.surveyDate || s.issuanceDate)
    );

    let dueDate, rangeFrom, rangeTo, anniversaryDate;

    const surveyNameNormalized = normalizeName(surveyName);

    // Robust dependency map for annual surveys
    const dependencyMap = {
        [normalizeName("Annual Survey")]: normalizeName("Special Survey Hull"),
        [normalizeName("Annual Survey IG System")]: normalizeName("Special Survey IG System"),
        [normalizeName("Annual Survey ( Fi-Fi)")]: normalizeName("Special Survey (Fi-Fi)"),
        [normalizeName("Annual Survey (UMS)")]: normalizeName("Special Survey (UMS)"),
    };

    switch (surveyNameNormalized) {
        // 5-yearly surveys
        case normalizeName("Special Survey Hull"):
        case normalizeName("Special Survey Machinery"):
        case normalizeName("Special Survey IG System"):
        case normalizeName("Special Survey (Fi-Fi)"):
        case normalizeName("Special Survey (UMS)"):
        case normalizeName("Continuous Survey Hull"):
        case normalizeName("Continuous Survey Machinery"):
            dueDate = addYears(issuanceDateObj, 5);
            rangeFrom = addMonths(dueDate, -3); // Only minus 3 months
            rangeTo = dueDate; // Same as due date
            anniversaryDate = dueDate;
            break;

        // Annual surveys
        case normalizeName("Annual Survey"):
        case normalizeName("Annual Survey IG System"):
        case normalizeName("Annual Survey ( Fi-Fi)"):
        case normalizeName("Annual Survey (UMS)"): {
            const relatedSpecialSurveyName = dependencyMap[surveyNameNormalized];
            const relatedSpecialSurvey = findSurveyByName(relatedSpecialSurveyName);

            let baseDate = relatedSpecialSurvey?.surveyDate
                ? moment(relatedSpecialSurvey.surveyDate)
                : relatedSpecialSurvey?.issuanceDate
                    ? moment(relatedSpecialSurvey.issuanceDate)
                    : issuanceDateObj;

            // Check for previous annual survey
            const lastAnnual = existingSurveys
                .filter((s) => normalizeName(s.surveyName) === surveyNameNormalized && s.dueDate)
                .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))[0];

            dueDate = lastAnnual ? addYears(moment(lastAnnual.dueDate), 1) : addYears(baseDate, 1);
            rangeFrom = addMonths(dueDate, -3);
            rangeTo = dueDate;
            anniversaryDate = dueDate;
            break;
        }

        // Docking / boiler / tailshaft surveys
        case normalizeName("Docking Survey"):
        case normalizeName("Main Boiler Survey"):
        case normalizeName("Auxiliary Boiler Survey"):
        case normalizeName("Thermal Oil Heating Systems Survey"):
        case normalizeName("Exhaust Gas Steam Generators and Economisers Survey"):
        case normalizeName("Tailshaft Condition Monitoring Annual Survey"): {
            const specialSurveyHull = findSurveyByName("special survey hull");
            const baseDate = specialSurveyHull?.surveyDate || specialSurveyHull?.issuanceDate || issuanceDateObj;
            const sshDueDate = addYears(baseDate, 5);

            const existingCurrentSurveys = existingSurveys
                .filter((s) => normalizeName(s.surveyName) === surveyNameNormalized && s.dueDate)
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

            if (!existingCurrentSurveys.length) {
                dueDate = addYears(baseDate, 3);
            } else if (existingCurrentSurveys.length === 1) {
                let nextDue = addYears(moment(existingCurrentSurveys[0].dueDate), 2);
                if (nextDue.isAfter(sshDueDate)) nextDue = addMonths(sshDueDate, -3);
                dueDate = nextDue;
            } else {
                dueDate = addYears(issuanceDateObj, 2);
            }

            if (dueDate.isAfter(sshDueDate)) dueDate = addMonths(sshDueDate, -3);
            rangeFrom = addMonths(dueDate, -3);
            rangeTo = dueDate;
            anniversaryDate = dueDate;
            break;
        }

        // Intermediate surveys - Auto-calculate both surveys in 5-year span
        case normalizeName("Intermediate Survey"): {
            const specialSurveyHull = findSurveyByName("special survey hull");
            if (specialSurveyHull) {
                const sshDate = moment(specialSurveyHull.surveyDate || specialSurveyHull.issuanceDate);
                const sshDueDate = addYears(sshDate, 5);

                // Find existing intermediate surveys in this cycle
                const existingIntermediates = existingSurveys
                    .filter((s) =>
                        normalizeName(s.surveyName) === surveyNameNormalized &&
                        s.dueDate &&
                        moment(s.dueDate).isAfter(sshDate) &&
                        moment(s.dueDate).isBefore(sshDueDate)
                    )
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

                // Calculate based on number of existing intermediates
                if (existingIntermediates.length === 0) {
                    // First intermediate: around year 2.5 (closer to year 2 or 3)
                    const candidate2 = addYears(sshDate, 2);
                    const candidate3 = addYears(sshDate, 3);
                    const target = addMonths(sshDate, 30); // 2.5 years
                    dueDate = Math.abs(candidate2 - target) < Math.abs(candidate3 - target) ? candidate2 : candidate3;
                } else if (existingIntermediates.length === 1) {
                    // Second intermediate: schedule at the alternate year (2 or 3)
                    const firstIntermediateDue = moment(existingIntermediates[0].dueDate);
                    const sshYear = sshDate.year();
                    const firstYear = firstIntermediateDue.year();
                    const yearsDiff = firstYear - sshYear;

                    // If first was closer to year 2, make second at year 3, and vice versa
                    if (yearsDiff <= 2) {
                        dueDate = addYears(sshDate, 3);
                    } else {
                        dueDate = addYears(sshDate, 2);
                    }
                } else if (existingIntermediates.length >= 2) {
                    // Already have 2 or more intermediates - check if we need another based on spacing
                    const lastIntermediate = existingIntermediates[existingIntermediates.length - 1];
                    const lastIntermediateDue = moment(lastIntermediate.dueDate);

                    // Calculate next due (2 years from last)
                    const nextDue = addYears(lastIntermediateDue, 2);

                    // Only schedule if it's before SSH due date
                    if (nextDue.isBefore(sshDueDate)) {
                        dueDate = nextDue;
                    } else {
                        dueDate = "";
                        rangeFrom = "";
                        rangeTo = "";
                    }
                }

                if (dueDate) {
                    rangeFrom = addMonths(dueDate, -3); // Only minus 3 months
                    rangeTo = dueDate; // Same as due date
                }
            } else {
                dueDate = "";
                rangeFrom = "";
                rangeTo = "";
            }
            anniversaryDate = dueDate;
            break;
        }

        // In-water surveys
        case normalizeName("In Water Survey"):
            dueDate = addYears(issuanceDateObj, 3);
            rangeFrom = "";
            rangeTo = "";
            anniversaryDate = dueDate;
            break;

        // Tailshaft surveys
        case normalizeName("Tailshaft Initial Survey"):
        case normalizeName("Tailshaft Periodical Survey"):
        case normalizeName("Tailshaft Renewal Survey"):
            dueDate = addYears(issuanceDateObj, 5);
            rangeFrom = "";
            rangeTo = "";
            anniversaryDate = dueDate;
            break;

        default:
            dueDate = "";
            rangeFrom = "";
            rangeTo = "";
            anniversaryDate = "";
    }

    return {
        dueDate: formatDate(dueDate),
        rangeFrom: formatDate(rangeFrom),
        rangeTo: formatDate(rangeTo),
        anniversaryDate: formatDate(anniversaryDate),
    };
};
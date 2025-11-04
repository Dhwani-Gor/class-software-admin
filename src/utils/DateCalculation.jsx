import moment from "moment";

export const calculateDates = (issuanceDate, surveyName, existingSurveys = []) => {
    if (!issuanceDate) return { dueDate: "", rangeFrom: "", rangeTo: "", anniversaryDate: "" };

    const issuanceDateObj = moment(issuanceDate);

    const addYears = (date, years) => (date ? moment(date).add(years, "years") : null);
    const addMonths = (date, months) => (date ? moment(date).add(months, "months") : null);
    const formatDate = (date) =>
        date && moment(date).isValid() ? moment(date).format("YYYY-MM-DD") : "";

    const normalizeName = (name) => name?.trim().toLowerCase().replace(/\s+/g, " ");

    const findSurveyByName = (name) =>
        existingSurveys.find(
            (s) =>
                normalizeName(s.surveyName) === normalizeName(name) &&
                (s.surveyDate || s.issuanceDate)
        );

    let dueDate, rangeFrom, rangeTo, anniversaryDate;

    const surveyNameNormalized = normalizeName(surveyName);

    const dependencyMap = {
        [normalizeName("Annual Survey")]: normalizeName("Special Survey Hull"),
        [normalizeName("Annual Survey IG System")]: normalizeName("Special Survey IG System"),
        [normalizeName("Annual Survey ( Fi-Fi)")]: normalizeName("Special Survey (Fi-Fi)"),
        [normalizeName("Annual Survey (UMS)")]: normalizeName("Special Survey (UMS)"),
    };

    // 🔹 Handle "special" or "continuous" surveys
    if (surveyNameNormalized.includes("special") || surveyNameNormalized.includes("continuous")) {
        const due = addYears(issuanceDateObj, 5);
        return {
            dueDate: formatDate(due),
            rangeFrom: formatDate(addMonths(due, -3)),
            rangeTo: formatDate(due),
            anniversaryDate: formatDate(due),
        };
    }

    switch (surveyNameNormalized) {
        // 🔹 Special & Continuous Surveys
        case normalizeName("Special Survey Hull"):
        case normalizeName("Special Survey Machinery"):
        case normalizeName("Special Survey IG System"):
        case normalizeName("Special Survey (Fi-Fi)"):
        case normalizeName("Special Survey (UMS)"):
        case normalizeName("Continuous Survey Hull"):
        case normalizeName("Continuous Survey Machinery"):
            dueDate = addYears(issuanceDateObj, 5);
            rangeFrom = addMonths(dueDate, +3);
            rangeTo = addMonths(dueDate, -3); // ✅ 3 months before and after
            anniversaryDate = dueDate;
            break;

        // 🔹 Annual Surveys (fixes SSH dependency & range)
        case normalizeName("Annual Survey"):
        case normalizeName("Annual Survey IG System"):
        case normalizeName("Annual Survey ( Fi-Fi)"):
        case normalizeName("Annual Survey (UMS)"): {
            const relatedSpecialSurveyName = dependencyMap[surveyNameNormalized];
            const relatedSpecialSurvey = findSurveyByName(relatedSpecialSurveyName);

            let baseDate = relatedSpecialSurvey?.dueDate
                ? moment(relatedSpecialSurvey.dueDate)
                : relatedSpecialSurvey?.surveyDate
                    ? moment(relatedSpecialSurvey.surveyDate)
                    : relatedSpecialSurvey?.issuanceDate
                        ? moment(relatedSpecialSurvey.issuanceDate)
                        : issuanceDateObj;

            const lastAnnual = existingSurveys
                .filter((s) => normalizeName(s.surveyName) === surveyNameNormalized && s.dueDate)
                .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))[0];

            if (lastAnnual) {
                dueDate = addYears(moment(lastAnnual.dueDate), 1);
            } else if (relatedSpecialSurvey?.dueDate) {
                dueDate = addYears(moment(relatedSpecialSurvey.dueDate), -4);
            } else {
                dueDate = addYears(baseDate, 1);
            }

            rangeFrom = addMonths(dueDate, +3);
            rangeTo = addMonths(dueDate, -3);
            anniversaryDate = dueDate;
            break;
        }

        case normalizeName("Docking Survey"):
        case normalizeName("Main Boiler Survey"):
        case normalizeName("Auxiliary Boiler Survey"):
        case normalizeName("Thermal Oil Heating Systems Survey"):
        case normalizeName("Exhaust Gas Steam Generators and Economisers Survey"): {
            const specialSurveyHull = findSurveyByName("special survey hull");
            const baseDate =
                specialSurveyHull?.surveyDate ||
                specialSurveyHull?.issuanceDate ||
                issuanceDateObj;
            const sshDueDate = addYears(baseDate, 5);

            const existingCurrentSurveys = existingSurveys
                .filter(
                    (s) => normalizeName(s.surveyName) === surveyNameNormalized && s.dueDate
                )
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

            // 🚫 No range for Docking/Boiler
            rangeFrom = "";
            rangeTo = "";
            anniversaryDate = dueDate;
            break;
        }

        // 🔹 Tailshaft Condition Monitoring Annual Survey — 3 months ± range
        case normalizeName("Tailshaft Condition Monitoring Annual Survey"): {
            const specialSurveyHull = findSurveyByName("special survey hull");
            const baseDate =
                specialSurveyHull?.surveyDate ||
                specialSurveyHull?.issuanceDate ||
                issuanceDateObj;
            const sshDueDate = addYears(baseDate, 5);

            const existingCurrentSurveys = existingSurveys
                .filter(
                    (s) => normalizeName(s.surveyName) === surveyNameNormalized && s.dueDate
                )
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

            // ✅ Tailshaft Annual gets ±3 months range
            rangeFrom = addMonths(dueDate, -3);
            rangeTo = addMonths(dueDate, +3);
            anniversaryDate = dueDate;
            break;
        }

        case normalizeName("Intermediate Survey"): {
            const specialSurveyHull = findSurveyByName("special survey hull");

            if (specialSurveyHull) {
                const sshDate = moment(
                    specialSurveyHull.surveyDate || specialSurveyHull.issuanceDate
                );
                const sshDueDate = addYears(sshDate, 5);

                const existingIntermediates = existingSurveys
                    .filter(
                        (s) =>
                            normalizeName(s.surveyName) === surveyNameNormalized &&
                            s.dueDate &&
                            moment(s.dueDate).isAfter(sshDate) &&
                            moment(s.dueDate).isBefore(sshDueDate)
                    )
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

                const currentSurvey = existingSurveys.find(
                    (s) => normalizeName(s.surveyName) === surveyNameNormalized
                );

                // ✅ NEW LOGIC START
                const currentSurveyDate = currentSurvey?.surveyDate
                    ? moment(currentSurvey.surveyDate)
                    : issuanceDateObj;

                // If the Intermediate survey was done on the same date as SSH → allow next due
                const sameAsSSH = currentSurveyDate.isSame(sshDate, "day");

                if (!sameAsSSH && existingIntermediates.length >= 1) {
                    // If already done once between 5 years, no next due date
                    dueDate = "";
                    rangeFrom = "";
                    rangeTo = "";
                    anniversaryDate = "";
                } else if (sameAsSSH) {
                    // If done same day as SSH → next due 2 and 3 years later options
                    const due2 = addYears(sshDate, 2);
                    const due3 = addYears(sshDate, 3);

                    // By default, set dueDate to 2 years later (you can pick which to display)
                    dueDate = due2;
                    rangeFrom = addMonths(dueDate, -3);
                    rangeTo = addMonths(dueDate, 3);
                    anniversaryDate = dueDate;

                    // If you want to provide both 2-year and 3-year options later in UI,
                    // you can store both in a separate variable for frontend dropdown
                } else if (existingIntermediates.length === 0) {
                    dueDate = addMonths(sshDate, 30); // around 2.5 years
                    rangeFrom = addMonths(dueDate, -3);
                    rangeTo = addMonths(dueDate, 3);
                } else if (existingIntermediates.length === 1) {
                    const firstIntermediateDue = moment(existingIntermediates[0].dueDate);
                    const yearsDiff = firstIntermediateDue.diff(sshDate, "years");
                    dueDate = yearsDiff <= 2 ? addYears(sshDate, 3) : addYears(sshDate, 2);
                    rangeFrom = addMonths(dueDate, -3);
                    rangeTo = addMonths(dueDate, 3);
                } else if (existingIntermediates.length >= 2) {
                    const lastIntermediate =
                        existingIntermediates[existingIntermediates.length - 1];
                    const nextDue = addYears(moment(lastIntermediate.dueDate), 2);
                    dueDate = nextDue.isBefore(sshDueDate) ? nextDue : "";
                    if (dueDate) {
                        rangeFrom = addMonths(dueDate, -3);
                        rangeTo = addMonths(dueDate, 3);
                    }
                }
                // ✅ NEW LOGIC END
            } else {
                dueDate = "";
                rangeFrom = "";
                rangeTo = "";
            }

            anniversaryDate = dueDate;
            break;
        }


        // 🔹 In-water Survey
        case normalizeName("In Water Survey"):
            dueDate = addYears(issuanceDateObj, 3);
            rangeFrom = "";
            rangeTo = "";
            anniversaryDate = dueDate;
            break;

        // 🔹 Tailshaft Surveys
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

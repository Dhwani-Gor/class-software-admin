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

    // 🔹 Handle "special" or "continuous" surveys generically
    if (surveyNameNormalized.includes("special") || surveyNameNormalized.includes("continuous")) {
        const due = addYears(issuanceDateObj, 5);
        return {
            dueDate: formatDate(due),
            rangeFrom: formatDate(addMonths(due, -3)), // ✅ -3 months only
            rangeTo: formatDate(due), // ✅ up to due date
            anniversaryDate: formatDate(due),
        };
    }

    switch (surveyNameNormalized) {
        // 🔹 Special & Continuous Surveys (explicit cases for clarity)
        case normalizeName("Special Survey Hull"):
        case normalizeName("Special Survey Machinery"):
        case normalizeName("Special Survey IG System"):
        case normalizeName("Special Survey (Fi-Fi)"):
        case normalizeName("Special Survey (UMS)"):
        case normalizeName("Continuous Survey Hull"):
        case normalizeName("Continuous Survey Machinery"):
            dueDate = addYears(issuanceDateObj, 5);
            rangeFrom = addMonths(dueDate, -3); // ✅ -3 months only
            rangeTo = dueDate; // ✅ up to due date
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

            // ✅ Annual surveys: -3 to +3 months range
            rangeFrom = addMonths(dueDate, -3);
            rangeTo = addMonths(dueDate, +3);
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

        // 🔹 Tailshaft Condition Monitoring Annual Survey — -3 to +3 months range
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

            // ✅ Tailshaft Annual gets -3 to +3 months range
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

                // Find all intermediate surveys conducted between SSH and SSH+5 years
                const existingIntermediates = existingSurveys
                    .filter(
                        (s) =>
                            normalizeName(s.surveyName) === surveyNameNormalized &&
                            s.surveyDate &&
                            moment(s.surveyDate).isAfter(sshDate) &&
                            moment(s.surveyDate).isBefore(sshDueDate)
                    )
                    .sort((a, b) => new Date(a.surveyDate) - new Date(b.surveyDate));

                // Check if current intermediate survey is on same date as SSH
                const currentSurveyDate = issuanceDateObj;
                const sameAsSSH = currentSurveyDate.isSame(sshDate, "day");

                if (sameAsSSH) {
                    // ✅ If done same day as SSH → next due can be 2 or 3 years later
                    // Default to 2 years (can be made configurable in UI)
                    dueDate = addYears(sshDate, 2);
                    rangeFrom = addMonths(dueDate, -3);
                    rangeTo = dueDate; // ✅ -3 months to due date
                    anniversaryDate = dueDate;

                    // Alternative: 3 years option (can be used in UI dropdown)
                    // const option2 = addYears(sshDate, 3);
                } else if (existingIntermediates.length >= 1) {
                    // ✅ If already done once between 5 years → no next due date
                    dueDate = "";
                    rangeFrom = "";
                    rangeTo = "";
                    anniversaryDate = "";
                } else {
                    // First intermediate survey → around 2.5 years from SSH
                    dueDate = addMonths(sshDate, 30);
                    rangeFrom = addMonths(dueDate, -3);
                    rangeTo = dueDate; // ✅ -3 months to due date
                    anniversaryDate = dueDate;
                }
            } else {
                dueDate = "";
                rangeFrom = "";
                rangeTo = "";
                anniversaryDate = "";
            }
            break;
        }

        // 🔹 In-water Survey
        case normalizeName("In Water Survey"):
            dueDate = addYears(issuanceDateObj, 3);
            rangeFrom = "";
            rangeTo = "";
            anniversaryDate = dueDate;
            break;

        // 🔹 Tailshaft Surveys (no range)
        case normalizeName("Tailshaft Initial Survey"):
        case normalizeName("Tailshaft Periodical Survey"):
        case normalizeName("Tailshaft Renewal Survey"):
            dueDate = addYears(issuanceDateObj, 5);
            rangeFrom = ""; // ✅ No range
            rangeTo = ""; // ✅ No range
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
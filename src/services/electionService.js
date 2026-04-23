// Static, logic-based functions for the Eligibility Checker and Election Timeline
// No API calls, ensuring efficiency

export const checkEligibility = (age, citizenshipStatus, registrationStatus) => {
    let messages = [];
    let isEligible = true;

    if (age < 18) {
        isEligible = false;
        messages.push("You must be at least 18 years old on or before the qualifying date to vote in India.");
    }

    if (citizenshipStatus !== 'indian-citizen') {
        isEligible = false;
        messages.push("You must be an Indian citizen to vote in Indian elections.");
    }

    if (isEligible && registrationStatus !== 'registered') {
        messages.push("You meet the basic requirements, but you need to register with the Election Commission of India (ECI) to get on the Electoral Roll.");
        isEligible = false;
    }

    if (isEligible) {
        return {
            eligible: true,
            message: "Great news! You appear eligible to vote. Make sure you carry your EPIC (Voter ID) to the polling booth."
        };
    } else {
        return {
            eligible: false,
            message: messages.join(" ")
        };
    }
};

export const getElectionSteps = () => {
    return [
        { step: 1, title: "Check Electoral Roll", description: "Ensure your name is on the voter list maintained by the Election Commission of India (ECI)." },
        { step: 2, title: "Locate Polling Booth", description: "Find your designated polling station and get your official voter slip." },
        { step: 3, title: "Carry Valid ID", description: "Take your EPIC (Voter ID card) or any other ECI-approved photo ID to the polling booth." },
        { step: 4, title: "Cast Your Vote", description: "Press the button next to your chosen candidate on the Electronic Voting Machine (EVM) or choose NOTA." },
        { step: 5, title: "Verify & Complete", description: "Check the VVPAT slip to verify your vote. The polling officer will mark your index finger with indelible ink." }
    ];
};

'use client';
import axios from 'axios';

export function formatPlaces(places, gonow) {
  console.log("Formatting places Go now is: ", gonow);

  // Initialize formatted object
  const formattedPlaces = {};

  // Iterate through the places array and format the data
  places.forEach((place, index) => {
    // Check if we need to filter by "open_now"
    if (gonow && (!place.opening_hours || !place.opening_hours.open_now)) {
      return; // Skip this place if it's not open and gonow is true
    }

    // Extract relevant details
    const name = place.name;
    const types = place.types ? place.types.join(", ") : "Unknown"; // Join types into a single string

    // Store in formatted object with the same key
    formattedPlaces[index] = { name, types };
  });

  return formattedPlaces;
}



export async function fetchLLMresponse(places, mood, hobby, activity, gonow) {
  console.log("Sending request to backend API for OpenAI response");
  const newplaces = formatPlaces(places, gonow);
  console.log("New places formatted to be sent to OPEN AI backend:", newplaces);

  try {
    const response = await axios.get('/api/fetchLLMresponse', {
      params: { newplaces: JSON.stringify(newplaces), mood, hobby, activity },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });

    console.log("Response from backend OPEN AI API:", response);

    // get the actual response from GPT as result
    const result = response.data.result.choices[0].message.content;
    console.log("Chat GPT's answer from LLM:", result);

    // Assuming 'result' contains the string in the format "number, match score"
    // Split the result string by ',' to extract the values
    const answer = result.split(',');

    // Extract and assign the values to separate variables
    let finalPlaceNumber = answer[0].trim(); // Trim to remove extra spaces
    let matchScore = answer[1].trim(); // Trim to remove extra spaces

    // Error checking for finalPlaceNumber
    if (isNaN(finalPlaceNumber) || !Number.isInteger(Number(finalPlaceNumber))) {
      finalPlaceNumber = 0; // Set to 0 if it's not a number
      console.log("Could Not Calculate Place Number: It was not a valid number");
    } else if (parseInt(finalPlaceNumber) > Object.keys(newplaces).length) {
      finalPlaceNumber = 0; // Set to 0 if it's not within the valid range
      console.log("Could Not Calculate Place Number: It was not in range");
    }

    // Error checking for matchScore
    if (matchScore === 'None') {
      matchScore = "Could Not Calculate"; // Set default value if match score is 'None'
      console.log("Could Not Calculate Match Score");
    }

    // Add percentage to matchScore if it is a valid score
    if (!isNaN(matchScore) && matchScore !== "Could Not Calculate") {
      matchScore = matchScore + "%"; // Add '%' to the match score
    }

    // Prepare the data to return or process further
    const data = { "place number from llm": finalPlaceNumber, "matchscore": matchScore };
    console.log("Data received from LLM: sending to process file. Data from LLM:", data);


    return data;

  } catch (error) {
    console.error("Error fetching data from backend API:", error);``
    throw error; // Re-throw the error for further handling
  }
}


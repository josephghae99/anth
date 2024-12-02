import { generateObject } from "ai";
import { z } from "zod";
import Amadeus from "amadeus";

import { claudeHaikuModel } from ".";

// Initialize Amadeus client if credentials are available
const amadeus = process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET
  ? new Amadeus({
      clientId: process.env.AMADEUS_CLIENT_ID,
      clientSecret: process.env.AMADEUS_CLIENT_SECRET
    })
  : null;

export async function generateFlightStatus({
  flightNumber,
  date,
}: {
  flightNumber: string;
  date: string;
}) {
  try {
    // Only try Amadeus if client is initialized
    if (amadeus) {
      // First try to get real flight status from Amadeus
      const response = await amadeus.schedule.flights.get({
        carrierCode: flightNumber.slice(0, 2),
        flightNumber: flightNumber.slice(2),
        scheduledDepartureDate: date
      });

      // Process real flight data
      const flight = response.data[0];
      return {
        flightNumber,
        departure: {
          cityName: flight.departure.iataCode,
          airportCode: flight.departure.iataCode,
          airportName: flight.departure.terminal,
          timestamp: flight.departure.at,
          terminal: flight.departure.terminal || "TBD",
          gate: flight.departure.terminal || "TBD",
        },
        arrival: {
          cityName: flight.arrival.iataCode,
          airportCode: flight.arrival.iataCode,
          airportName: flight.arrival.terminal,
          timestamp: flight.arrival.at,
          terminal: flight.arrival.terminal || "TBD",
          gate: flight.arrival.terminal || "TBD",
        },
        totalDistanceInMiles: Math.round(flight.distance?.value || 0),
      };
    }
    throw new Error("Amadeus client not initialized");
  } catch (error) {
    // Fallback to AI generation
    const { object: flightStatus } = await generateObject({
      model: claudeHaikuModel,
      prompt: `Flight status for flight number ${flightNumber} on ${date}`,
      schema: z.object({
        flightNumber: z.string().describe("Flight number, e.g., BA123, AA31"),
        departure: z.object({
          cityName: z.string().describe("Name of the departure city"),
          airportCode: z.string().describe("IATA code of the departure airport"),
          airportName: z.string().describe("Full name of the departure airport"),
          timestamp: z.string().describe("ISO 8601 departure date and time"),
          terminal: z.string().describe("Departure terminal"),
          gate: z.string().describe("Departure gate"),
        }),
        arrival: z.object({
          cityName: z.string().describe("Name of the arrival city"),
          airportCode: z.string().describe("IATA code of the arrival airport"),
          airportName: z.string().describe("Full name of the arrival airport"),
          timestamp: z.string().describe("ISO 8601 arrival date and time"),
          terminal: z.string().describe("Arrival terminal"),
          gate: z.string().describe("Arrival gate"),
        }),
        totalDistanceInMiles: z.number().describe("Total flight distance in miles"),
      }),
    });
    return flightStatus;
  }
}

export async function generateFlightSearchResults({
  origin,
  destination,
  departureDate = new Date().toISOString().split('T')[0],
}: {
  origin: string;
  destination: string;
  departureDate?: string;
}) {
  try {
    // Search real flights using Amadeus
    if (!amadeus) {
      throw new Error("Amadeus client not initialized");
    }

    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      adults: 1,
      max: 4
    });

    // Process and format real flight offers
    return {
      flights: response.data.map((offer) => ({
        id: `${offer.validatingAirlineCodes[0]}${offer.itineraries[0].segments[0].number}`,
        departure: {
          cityName: offer.itineraries[0].segments[0].departure.iataCode,
          airportCode: offer.itineraries[0].segments[0].departure.iataCode,
          timestamp: offer.itineraries[0].segments[0].departure.at,
        },
        arrival: {
          cityName: offer.itineraries[0].segments[0].arrival.iataCode,
          airportCode: offer.itineraries[0].segments[0].arrival.iataCode,
          timestamp: offer.itineraries[0].segments[0].arrival.at,
        },
        airlines: offer.validatingAirlineCodes,
        priceInUSD: parseFloat(offer.price.total),
        numberOfStops: offer.itineraries[0].segments.length - 1,
      }))
    };
  } catch (error) {
    // Fallback to AI generation
    const { object: flightSearchResults } = await generateObject({
      model: claudeHaikuModel,
      prompt: `Generate search results for flights from ${origin} to ${destination}, limit to 4 results`,
      output: "array",
      schema: z.object({
        id: z.string().describe("Unique identifier for the flight, like BA123, AA31, etc."),
        departure: z.object({
          cityName: z.string().describe("Name of the departure city"),
          airportCode: z.string().describe("IATA code of the departure airport"),
          timestamp: z.string().describe("ISO 8601 departure date and time"),
        }),
        arrival: z.object({
          cityName: z.string().describe("Name of the arrival city"),
          airportCode: z.string().describe("IATA code of the arrival airport"),
          timestamp: z.string().describe("ISO 8601 arrival date and time"),
        }),
        airlines: z.array(z.string().describe("Airline names, e.g., American Airlines, Emirates")),
        priceInUSD: z.number().describe("Flight price in US dollars"),
        numberOfStops: z.number().describe("Number of stops during the flight"),
      }),
    });
    return { flights: flightSearchResults };
  }
}

export async function generateSeatSelection({
  flightNumber,
}: {
  flightNumber: string;
}) {
  try {
    // Try to get real seat map from Amadeus
    if (!amadeus) {
      throw new Error("Amadeus client not initialized");
    }

    const response = await amadeus.shopping.seatmaps.get({
      flightOrderId: flightNumber
    });

    // Process real seat data
    const seatmap = response.data[0];
    const seats = seatmap.decks[0].seats.map((seat) => ({
      seatNumber: seat.number,
      priceInUSD: parseFloat(seat.travelerPricing[0].price.total),
      isAvailable: seat.travelerPricing[0].status === "AVAILABLE"
    }));

    return { seats };
  } catch (error) {
    // Fallback to AI generation
    const { object: rows } = await generateObject({
      model: claudeHaikuModel,
      prompt: `Simulate available seats for flight number ${flightNumber}, 6 seats on each row and 5 rows in total, adjust pricing based on location of seat`,
      output: "array",
      schema: z.array(
        z.object({
          seatNumber: z.string().describe("Seat identifier, e.g., 12A, 15C"),
          priceInUSD: z.number().describe("Seat price in US dollars, less than $99"),
          isAvailable: z.boolean().describe("Whether the seat is available for booking"),
        }),
      ),
    });
    return { seats: rows };
  }
}

export async function generateReservationPrice(props: {
  seats: string[];
  flightNumber: string;
  departure: {
    cityName: string;
    airportCode: string;
    timestamp: string;
    gate: string;
    terminal: string;
  };
  arrival: {
    cityName: string;
    airportCode: string;
    timestamp: string;
    gate: string;
    terminal: string;
  };
  passengerName: string;
}) {
  const { object: reservation } = await generateObject({
    model: claudeHaikuModel,
    prompt: `Generate price for the following reservation \n\n ${JSON.stringify(props, null, 2)}`,
    schema: z.object({
      totalPriceInUSD: z.number().describe("Total reservation price in US dollars"),
    }),
  });

  return reservation;
}

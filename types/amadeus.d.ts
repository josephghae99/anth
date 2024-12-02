declare module 'amadeus' {
  interface AmadeusConstructor {
    new (config: { clientId: string; clientSecret: string }): Amadeus;
  }

  interface AmadeusResponse<T> {
    data: T[];
    meta: any;
  }

  interface FlightData {
    departure: {
      iataCode: string;
      terminal?: string;
      at: string;
    };
    arrival: {
      iataCode: string;
      terminal?: string;
      at: string;
    };
    distance?: {
      value: number;
    };
  }

  interface FlightOffer {
    validatingAirlineCodes: string[];
    itineraries: Array<{
      segments: Array<{
        departure: {
          iataCode: string;
          at: string;
        };
        arrival: {
          iataCode: string;
          at: string;
        };
        number: string;
      }>;
    }>;
    price: {
      total: string;
    };
  }

  interface SeatMap {
    decks: Array<{
      seats: Array<{
        number: string;
        travelerPricing: Array<{
          price: {
            total: string;
          };
          status: string;
        }>;
      }>;
    }>;
  }

  interface Amadeus {
    schedule: {
      flights: {
        get(params: {
          carrierCode: string;
          flightNumber: string;
          scheduledDepartureDate: string;
        }): Promise<AmadeusResponse<FlightData>>;
      };
    };
    shopping: {
      flightOffersSearch: {
        get(params: {
          originLocationCode: string;
          destinationLocationCode: string;
          departureDate: string;
          adults: number;
          max: number;
        }): Promise<AmadeusResponse<FlightOffer>>;
      };
      seatmaps: {
        get(params: { flightOrderId: string }): Promise<AmadeusResponse<SeatMap>>;
      };
    };
  }

  const Amadeus: AmadeusConstructor;
  export default Amadeus;
} 
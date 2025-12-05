import math
import uuid

class DigitalPlanter:
    def __init__(self, name, lat, lon, is_user_planted=False, id=None, user_id=None, photo_url=None, address=None, landmarks=None):
        self.id = id if id else str(uuid.uuid4())
        self.user_id = user_id
        self.name = name
        self.lat = lat
        self.lon = lon
        self.is_user_planted = is_user_planted
        self.photo_url = photo_url
        self.address = address
        self.landmarks = landmarks if landmarks else []

    def is_near_location(self, user_lat, user_lon):
        """
        Checks if the user is within 50 meters of the planter using the Haversine formula.
        Returns a welcome message if true, otherwise None.
        """
        R = 6371000  # Radius of Earth in meters
        phi1 = math.radians(self.lat)
        phi2 = math.radians(user_lat)
        delta_phi = math.radians(user_lat - self.lat)
        delta_lambda = math.radians(user_lon - self.lon)

        a = math.sin(delta_phi / 2.0) ** 2 + \
            math.cos(phi1) * math.cos(phi2) * \
            math.sin(delta_lambda / 2.0) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        distance = R * c

        if distance <= 50:
            return f"Welcome to {self.name}! You are within {distance:.2f} meters."
        return None

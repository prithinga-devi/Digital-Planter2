import unittest
import json
from digital_planter import DigitalPlanter
from app import app, planters

class TestDigitalPlanter(unittest.TestCase):
    def test_is_near_location(self):
        # Test location: 0, 0
        planter = DigitalPlanter("Test", 0.0, 0.0)
        
        # User at 0, 0 (0 meters away)
        self.assertIsNotNone(planter.is_near_location(0.0, 0.0))
        
        # User at 0.0001, 0 (approx 11 meters away)
        self.assertIsNotNone(planter.is_near_location(0.0001, 0.0))
        
        # User far away
        self.assertIsNone(planter.is_near_location(1.0, 1.0))

class TestFlaskApp(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        # Add a test planter for the generic test
        self.test_planter = DigitalPlanter("Test Garden", 0.0, 0.0)
        planters.append(self.test_planter)

    def tearDown(self):
        if self.test_planter in planters:
            planters.remove(self.test_planter)

    def test_index_route(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)

    def test_check_location_nearby(self):
        # Test Garden is at 0.0, 0.0
        response = self.app.post('/check_location', 
                                 data=json.dumps({'lat': 0.0, 'lon': 0.0}),
                                 content_type='application/json')
        data = json.loads(response.data)
        self.assertTrue(data['nearby'])
        self.assertIn('Welcome to Test Garden', data['message'])

    def test_check_location_far(self):
        response = self.app.post('/check_location', 
                                 data=json.dumps({'lat': 50.0, 'lon': 50.0}),
                                 content_type='application/json')
        data = json.loads(response.data)
        self.assertFalse(data['nearby'])
        self.assertEqual(data['message'], 'No plants nearby.')

    def test_invalid_input(self):
        response = self.app.post('/check_location', 
                                 data=json.dumps({'lat': 'invalid'}),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)

if __name__ == '__main__':
    unittest.main()

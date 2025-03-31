# src/ShareCalendar.py
from flask import Flask, request, jsonify

app = Flask(__name__)

calendars = {}

@app.route('/create_calendar', methods=['POST'])
def create_calendar():
    data = request.json
    calendarID = data.get('calendarID')
    owner = data.get('owner')
    if calendarID in calendars:
        return jsonify({'error': 'Calendar already exists'}), 400
    calendars[calendarID] = {'owner': owner, 'sharedWith': []}
    return jsonify({'message': 'Calendar created successfully'}), 201

@app.route('/share_calendar', methods=['POST'])
def share_calendar():
    data = request.json
    calendarID = data.get('calendarID')
    user = data.get('user')
    calendar = calendars.get(calendarID)
    if not calendar:
        return jsonify({'error': 'Calendar not found'}), 404
    if user not in calendar['sharedWith']:
        calendar['sharedWith'].append(user)
        return jsonify({'message': 'Calendar shared successfully'}), 200
    return jsonify({'error': 'User already has access'}), 400

@app.route('/unshare_calendar', methods=['POST'])
def unshare_calendar():
    data = request.json
    calendarID = data.get('calendarID')
    user = data.get('user')
    calendar = calendars.get(calendarID)
    if not calendar:
        return jsonify({'error': 'Calendar not found'}), 404
    if user in calendar['sharedWith']:
        calendar['sharedWith'].remove(user)
        return jsonify({'message': 'Calendar unshared successfully'}), 200
    return jsonify({'error': 'User does not have access'}), 400

@app.route('/is_shared_with', methods=['GET'])
def is_shared_with():
    calendarID = request.args.get('calendarID')
    user = request.args.get('user')
    calendar = calendars.get(calendarID)
    if not calendar:
        return jsonify({'error': 'Calendar not found'}), 404
    return jsonify({'isSharedWith': user in calendar['sharedWith']}), 200

@app.route('/get_shared_users', methods=['GET'])
def get_shared_users():
    calendarID = request.args.get('calendarID')
    calendar = calendars.get(calendarID)
    if not calendar:
        return jsonify({'error': 'Calendar not found'}), 404
    return jsonify({'sharedWith': calendar['sharedWith']}), 200

@app.route('/validate_share', methods=['POST'])
def validate_share():
    data = request.json
    calendarID = data.get('calendarID')
    user = data.get('user')
    otherCalendarID = data.get('otherCalendarID')
    calendar = calendars.get(calendarID)
    otherCalendar = calendars.get(otherCalendarID)
    if not calendar or not otherCalendar:
        return jsonify({'error': 'One or both calendars not found'}), 404
    isValid = user in calendar['sharedWith'] and calendar['owner'] in otherCalendar['sharedWith']
    return jsonify({'isValid': isValid}), 200
    

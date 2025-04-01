from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)

# Initialize Firebase Admin SDK
cred = credentials.Certificate("C:\StudyBuds\StudyBuds\studybuds\serviceAccountKey.Json")
firebase_admin.initialize_app(cred)
db = firestore.client()

@app.route('/share-calendar', methods=['POST'])
def share_calendar():
    data = request.json
    event_id = data.get('eventId')
    shared_with_email = data.get('sharedWith')

    if not event_id or not shared_with_email:
        return jsonify({"error": "Missing eventId or sharedWith"}), 400

    # Update the event in Firestore to include the shared email
    event_ref = db.collection('events').document(event_id)
    event = event_ref.get()
    if not event.exists:
        return jsonify({"error": "Event not found"}), 404

    event_data = event.to_dict()
    shared_with = event_data.get('sharedWith', [])
    if shared_with_email not in shared_with:
        shared_with.append(shared_with_email)
        event_ref.update({'sharedWith': shared_with})

    return jsonify({"message": "Event shared successfully"}), 200

if __name__ == '__main__':
    app.run(debug=True)
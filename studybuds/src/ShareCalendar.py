# src/ShareCalendar.py
from flask import Flask, request, jsonify

class ShareCalendar:
    def __init__(self, calendarID, owner):
        self.calendarID = calendarID
        self.owner = owner
        self.sharedWith = []

    def shareCalendar(self, user):
        if user not in self.sharedWith:
            self.sharedWith.append(user)
            return True
        return False

    def unshareCalendar(self, user):
        if user in self.sharedWith:
            self.sharedWith.remove(user)
            return True
        return False

    def isSharedWith(self, user):
        return user in self.sharedWith

    def getSharedUsers(self):
        return self.sharedWith

    def validateShare(self, user, otherCalendar):
        return self.isSharedWith(user) and otherCalendar.isSharedWith(self.owner)
    

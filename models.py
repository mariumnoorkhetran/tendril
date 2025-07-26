from db import db

class User(db.Model):
    username = db.Column(db.String(80), primary_key=True)
    streak = db.Column(db.Integer, default=0)
    last_completed = db.Column(db.String(20))
    paused = db.Column(db.Boolean, default=False)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), db.ForeignKey('user.username'))
    name = db.Column(db.String(120))
    completed = db.Column(db.Boolean, default=False)

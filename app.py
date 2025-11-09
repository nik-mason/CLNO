from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__, static_folder='assets', static_url_path='/assets')

# Helper to load data from JSON files
def load_data(filename):
    try:
        with open(os.path.join('data', filename), 'r', encoding='utf-8') as f:
            return json.load(f)
    except (IOError, json.JSONDecodeError):
        return None

# Helper to verify class password
def verify_class_password(school_id, grade, class_num, password):
    passwords = load_data('passwords.json')
    if not passwords:
        return False
    
    try:
        expected_password = passwords[str(school_id)][str(grade)][str(class_num)]
        return password == expected_password
    except (KeyError, TypeError):
        return False

@app.route('/')
def index():
    return render_template('index.html')

# API to get the list of schools
@app.route('/api/schools', methods=['GET'])
def get_schools():
    schools = load_data('schools.json')
    if schools is not None:
        return jsonify(schools)
    return jsonify({"success": False, "message": "학교 데이터를 불러올 수 없습니다."}), 500

# API for teacher login
@app.route('/api/login/teacher', methods=['POST'])
def login_teacher():
    data = request.get_json()
    if not data or 'password' not in data:
        return jsonify({"success": False, "message": "비밀번호를 입력해주세요."}), 400

    config = load_data('config.json')
    if config and data.get('password') == config.get('teacherPassword'):
        return jsonify({"success": True, "message": "Teacher login successful"})
    else:
        return jsonify({"success": False, "message": "비밀번호가 올바르지 않습니다."}), 401

# API to verify class details before proceeding
@app.route('/api/verify/class', methods=['POST'])
def verify_class():
    data = request.get_json()
    required_fields = ['schoolId', 'grade', 'class', 'password']
    if not data or not all(k in data and data[k] for k in required_fields):
        return jsonify({"success": False, "message": "모든 필드를 입력해주세요."}), 400

    if verify_class_password(data['schoolId'], data['grade'], data['class'], data['password']):
        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "message": "학급 정보를 찾을 수 없거나 비밀번호가 일치하지 않습니다."}), 401

# API for student PIN login
@app.route('/api/login/student', methods=['POST'])
def login_student():
    data = request.get_json()
    required_fields = ['schoolId', 'grade', 'classNum', 'attendanceNum', 'pin']
    if not data or not all(k in data and data[k] for k in required_fields):
        return jsonify({"success": False, "message": "모든 필드를 입력해주세요."}), 400
    
    try:
        # PIN rule: schoolId + grade + classNum + attendanceNum
        expected_pin = f"{data['schoolId']}{data['grade']}{data['classNum']}{data['attendanceNum']}"
        
        if data['pin'] == expected_pin:
            return jsonify({"success": True, "message": "Student login successful"})
        else:
            return jsonify({"success": False, "message": "PIN 번호가 올바르지 않습니다."}), 401
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "입력값이 올바르지 않습니다."}), 400

@app.route('/api/announcements', methods=['GET'])
def get_announcements():
    announcements = load_data('announcements.json')
    if announcements is not None:
        return jsonify(announcements)
    return jsonify({"success": False, "message": "공지사항 데이터를 불러올 수 없습니다."}), 500

if __name__ == '__main__':
    app.run(debug=True)
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

# Helper to save data to JSON files
def save_data(filename, data):
    try:
        with open(os.path.join('data', filename), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except IOError:
        return False

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

@app.route('/api/daily_homework', methods=['GET'])
def get_daily_homework():
    school_id = request.args.get('school_id')
    grade = request.args.get('grade')
    class_num = request.args.get('class')

    if not all([school_id, grade, class_num]):
        return jsonify({"success": False, "message": "학교, 학년, 반 정보를 모두 입력해주세요."}), 400

    try:
        school_id = int(school_id)
        grade = int(grade)
        class_num = int(class_num)
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "입력값이 올바르지 않습니다."}), 400

    homeworks = load_data('daily_homework.json')
    if homeworks is None:
        return jsonify({"success": False, "message": "숙제 데이터를 불러올 수 없습니다."}), 500

    filtered_homework = [
        hw for hw in homeworks
        if hw.get('schoolId') == school_id and hw.get('grade') == grade and hw.get('class') == class_num
    ]

    return jsonify(filtered_homework)

@app.route('/api/personal_homework', methods=['GET'])
def get_personal_homework():
    school_id = request.args.get('school_id')
    grade = request.args.get('grade')
    class_num = request.args.get('class')
    attendance_num = request.args.get('attendance_num')

    if not all([school_id, grade, class_num, attendance_num]):
        return jsonify({"success": False, "message": "학교, 학년, 반, 출석번호 정보를 모두 입력해주세요."}), 400

    try:
        school_id = int(school_id)
        grade = int(grade)
        class_num = int(class_num)
        attendance_num = int(attendance_num)
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "입력값이 올바르지 않습니다."}), 400

    personal_homeworks = load_data('personal_homework.json')
    if personal_homeworks is None:
        return jsonify({"success": False, "message": "개인 숙제 데이터를 불러올 수 없습니다."}), 500

    filtered_personal_homework = [
        hw for hw in personal_homeworks
        if hw.get('schoolId') == school_id and \
           hw.get('grade') == grade and \
           hw.get('class') == class_num and \
           hw.get('attendanceNumber') == attendance_num
    ]

    return jsonify(filtered_personal_homework)

# --- Teacher Upload APIs ---

@app.route('/api/upload/announcement', methods=['POST'])
def upload_announcement():
    data = request.get_json()
    if not data or not all(k in data for k in ['title', 'content', 'schoolId', 'grade', 'classNum']):
        return jsonify({"success": False, "message": "모든 필드를 입력해주세요."}), 400

    announcements = load_data('announcements.json') or []
    new_id = max([ann.get('id', 0) for ann in announcements] + [0]) + 1
    
    new_announcement = {
        "id": new_id,
        "schoolId": int(data['schoolId']),
        "grade": int(data['grade']),
        "class": int(data['classNum']),
        "uploadDate": "2025-11-09", # Placeholder, ideally use current date
        "title": data['title'],
        "content": data['content']
    }
    announcements.append(new_announcement)

    if save_data('announcements.json', announcements):
        return jsonify({"success": True, "message": "공지사항이 등록되었습니다."})
    else:
        return jsonify({"success": False, "message": "공지사항 저장에 실패했습니다."}), 500

@app.route('/api/upload/daily_homework', methods=['POST'])
def upload_daily_homework():
    data = request.get_json()
    if not data or not all(k in data for k in ['title', 'dueDate', 'tasks', 'schoolId', 'grade', 'classNum']):
        return jsonify({"success": False, "message": "모든 필드를 입력해주세요."}), 400

    homeworks = load_data('daily_homework.json') or []
    new_id = max([hw.get('id', 0) for hw in homeworks] + [0]) + 1

    new_homework = {
        "id": new_id,
        "schoolId": int(data['schoolId']),
        "grade": int(data['grade']),
        "class": int(data['classNum']),
        "uploadDate": "2025-11-09", # Placeholder
        "dueDate": data['dueDate'],
        "title": data['title'],
        "tasks": [{"id": i+1, "content": task} for i, task in enumerate(data['tasks'])]
    }
    homeworks.append(new_homework)

    if save_data('daily_homework.json', homeworks):
        return jsonify({"success": True, "message": "오늘의 숙제가 등록되었습니다."})
    else:
        return jsonify({"success": False, "message": "숙제 저장에 실패했습니다."}), 500

@app.route('/api/upload/personal_homework', methods=['POST'])
def upload_personal_homework():
    data = request.get_json()
    if not data or not all(k in data for k in ['title', 'dueDate', 'tasks', 'schoolId', 'grade', 'classNum', 'attendanceNum']):
        return jsonify({"success": False, "message": "모든 필드를 입력해주세요."}), 400

    homeworks = load_data('personal_homework.json') or []
    new_id = max([hw.get('id', 0) for hw in homeworks] + [0]) + 1

    new_homework = {
        "id": new_id,
        "schoolId": int(data['schoolId']),
        "grade": int(data['grade']),
        "class": int(data['classNum']),
        "attendanceNumber": int(data['attendanceNum']),
        "uploadDate": "2025-11-09", # Placeholder
        "dueDate": data['dueDate'],
        "title": data['title'],
        "tasks": [{"id": i+1, "content": task} for i, task in enumerate(data['tasks'])]
    }
    homeworks.append(new_homework)

    if save_data('personal_homework.json', homeworks):
        return jsonify({"success": True, "message": "개인 숙제가 등록되었습니다."})
    else:
        return jsonify({"success": False, "message": "숙제 저장에 실패했습니다."}), 500

if __name__ == '__main__':
    app.run(debug=True) 
from flask import Flask, render_template, jsonify, request
import json

app = Flask(__name__, static_folder='assets', static_url_path='/assets')

# 웹 페이지 호스팅
@app.route('/')
def index():
    return render_template('index.html')

# JSON 데이터 읽기
@app.route('/api/data', methods=['GET'])
def get_data():
    with open('data/data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

# JSON 데이터 수정
@app.route('/api/data', methods=['POST'])
def update_data():
    new_data = request.get_json()
    with open('data/data.json', 'w', encoding='utf-8') as f:
        json.dump(new_data, f, ensure_ascii=False, indent=4)
    return jsonify({"message": "Data updated successfully"})

if __name__ == '__main__':
    app.run(debug=True)
    

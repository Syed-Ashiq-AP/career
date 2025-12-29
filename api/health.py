from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/health', methods=['GET'])
def health():
    """Vercel serverless function handler for health check"""
    return jsonify({
        'status': 'ok',
        'message': 'Server running with intelligent question routing'
    })

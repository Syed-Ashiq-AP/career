from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import random
import os
from openai import OpenAI

app = Flask(__name__)
CORS(app)

# Initialize Perplexity client
perplexity_client = OpenAI(
    api_key=os.getenv('PERPLEXITY_API_KEY', ''),
    base_url="https://api.perplexity.ai"
)

# Load dataset with question relationships
with open('dataset_with_relations.json', 'r') as f:
    dataset = json.load(f)


def get_question_by_id(question_id):
    """Get a question by its ID"""
    return dataset['questions'].get(str(question_id))


def select_next_question_intelligent(answered_questions, user_answers):
    """
    Intelligently select the next question based on:
    1. The user's previous answer (using next_questions relationships)
    2. Category patterns to explore or confirm trends
    3. Question diversity to cover all important dimensions
    (Stateless - works with serverless deployment)
    """
    
    # If no questions answered yet, start with the designated start question
    if not answered_questions:
        return get_question_by_id(dataset['start_question'])
    
    # Get the last question and answer
    # Convert to string key since JSON converts dict keys to strings
    last_question_id = answered_questions[-1]
    last_answer = user_answers[str(last_question_id)]
    last_question = get_question_by_id(last_question_id)
    
    # Get suggested next questions from the last answer
    selected_option = last_answer['selected_option']
    suggested_next = last_question['options'][selected_option].get('next_questions', [])
    
    # Filter out already answered questions
    available_next = [q_id for q_id in suggested_next if q_id not in answered_questions]
    
    # Analyze user's category pattern to make intelligent choice
    category_scores = {}
    for answer_data in user_answers.values():
        category = answer_data.get('category', '')
        category_scores[category] = category_scores.get(category, 0) + 1
    
    # Get dominant category
    dominant_category = max(category_scores.items(), key=lambda x: x[1])[0] if category_scores else None
    
    # Score the available next questions
    def score_question(q_id):
        question = get_question_by_id(q_id)
        if not question:
            return 0
        
        score = 0
        
        # Check if this question can help confirm or explore the dominant category
        option_categories = [opt['category'] for opt in question['options'].values()]
        
        # Higher score if question explores the dominant category
        if dominant_category in option_categories:
            score += 3
        
        # Higher score if question explores underrepresented categories (diversity)
        for cat in option_categories:
            if cat not in category_scores or category_scores[cat] < 2:
                score += 2
        
        # Check question group diversity
        answered_groups = set()
        for ans_q_id in answered_questions:
            ans_q = get_question_by_id(ans_q_id)
            if ans_q:
                answered_groups.add(ans_q.get('group', ''))
        
        if question.get('group', '') not in answered_groups:
            score += 4  # Prioritize new groups
        
        return score
    
    if available_next:
        # Score and sort the suggested next questions
        scored_questions = [(q_id, score_question(q_id)) for q_id in available_next]
        scored_questions.sort(key=lambda x: x[1], reverse=True)
        
        # Return the highest scoring question
        return get_question_by_id(scored_questions[0][0])
    
    # Fallback: if no suggested questions available, find any unanswered question
    all_question_ids = [int(q_id) for q_id in dataset['questions'].keys()]
    unanswered = [q_id for q_id in all_question_ids if q_id not in answered_questions]
    
    if unanswered:
        # Score all unanswered questions
        scored_questions = [(q_id, score_question(q_id)) for q_id in unanswered]
        scored_questions.sort(key=lambda x: x[1], reverse=True)
        return get_question_by_id(scored_questions[0][0])
    
    return None  # No more questions


@app.route('/api/start', methods=['POST'])
def start_survey():
    """Get the first question (stateless)"""
    # Get first question
    first_question = select_next_question_intelligent([], {})
    
    return jsonify({
        'question': first_question,
        'total_answered': 0
    })


@app.route('/api/answer', methods=['POST'])
def submit_answer():
    """Submit an answer and get the next question (stateless)"""
    data = request.json
    answered_questions = data.get('answered_questions', [])
    user_answers = data.get('user_answers', {})
    
    # Check if we've reached the question limit
    if len(answered_questions) >= 5:
        return jsonify({
            'completed': True,
            'total_answered': len(answered_questions)
        })
    
    # Get next question using intelligent selection
    next_question = select_next_question_intelligent(
        answered_questions,
        user_answers
    )
    
    if next_question is None:
        # Survey complete
        return jsonify({
            'completed': True,
            'total_answered': len(answered_questions)
        })
    
    return jsonify({
        'completed': False,
        'question': next_question,
        'total_answered': len(answered_questions)
    })


@app.route('/api/current', methods=['POST'])
def get_current_question():
    """Get the current question based on answer history (stateless)"""
    data = request.json
    answered_questions = data.get('answered_questions', [])
    user_answers = data.get('user_answers', {})
    
    # Get next question based on current history
    question = select_next_question_intelligent(
        answered_questions,
        user_answers
    )
    
    if not question:
        return jsonify({'error': 'No question available'}), 404
    
    return jsonify({
        'question': question,
        'total_answered': len(answered_questions)
    })


@app.route('/api/results', methods=['POST'])
def get_results():
    """Calculate and return career recommendations using Perplexity AI (stateless)"""
    data = request.json
    answers = data.get('user_answers', {})
    
    # Build a summary of user's answers for AI analysis
    answer_summary = []
    category_scores = {}
    all_careers = []
    
    for answer_data in answers.values():
        category = answer_data['category']
        category_scores[category] = category_scores.get(category, 0) + 1
        all_careers.extend(answer_data.get('careers', []))
        answer_summary.append({
            'answer': answer_data['text'],
            'category': category
        })
    
    # Count career mentions
    career_counts = {}
    for career in all_careers:
        career_counts[career] = career_counts.get(career, 0) + 1
    
    # Get top mentioned careers
    sorted_careers = sorted(career_counts.items(), key=lambda x: x[1], reverse=True)
    top_mentioned_careers = [career for career, _ in sorted_careers[:10]]
    
    # Sort categories by frequency
    sorted_categories = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
    
    try:
        # Use Perplexity AI to analyze and provide intelligent career recommendations
        response = perplexity_client.chat.completions.create(
            model="llama-3.1-sonar-large-128k-online",
            messages=[
                {
                    "role": "system",
                    "content": """You are an expert career counselor with deep knowledge of various career paths, 
                    market trends, and educational requirements. Analyze the user's answers and provide the top 3 
                    most suitable career recommendations with detailed, personalized explanations. Consider current 
                    job market trends, growth potential, and alignment with their interests."""
                },
                {
                    "role": "user",
                    "content": f"""Based on this career assessment data, recommend the TOP 3 best career matches:

User's Answer Pattern:
{json.dumps(answer_summary, indent=2)}

Category Scores:
{json.dumps(dict(sorted_categories), indent=2)}

Frequently Mentioned Careers:
{json.dumps(top_mentioned_careers, indent=2)}

Please provide EXACTLY 3 career recommendations in JSON format:
{{
  "careers": [
    {{
      "career": "Career Title",
      "match_percentage": 95,
      "description": "2-3 sentence detailed explanation of why this career fits based on their specific answers and current market trends",
      "category": "Primary Category"
    }}
  ],
  "summary": "Brief overall assessment of the user's career profile"
}}

Focus on practical, achievable careers that align with their demonstrated interests and capabilities."""
                }
            ],
            temperature=0.3,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        ai_result = json.loads(response.choices[0].message.content)
        
        # Extract AI-recommended careers
        ai_careers = ai_result.get('careers', [])[:3]
        summary = ai_result.get('summary', '')
        
        # Format the response
        top_careers = [
            {
                'career': career.get('career', 'Unknown'),
                'mentions': career.get('match_percentage', 0),
                'description': career.get('description', ''),
                'category': career.get('category', '')
            }
            for career in ai_careers
        ]
        
    except Exception as e:
        print(f"Perplexity AI error: {e}")
        # Fallback to simple counting if AI fails
        top_careers = [
            {
                'career': career,
                'mentions': count,
                'description': 'Based on your answers, this career aligns well with your interests and skills.',
                'category': sorted_categories[0][0] if sorted_categories else ''
            }
            for career, count in sorted_careers[:3]
        ]
        summary = "Your career profile shows strong alignment with these fields."
    
    # Get category information
    top_categories = [
        {
            'category': cat,
            'score': score,
            'percentage': round((score / len(answers)) * 100, 1),
            'description': dataset['categories'].get(cat, {}).get('description', '')
        }
        for cat, score in sorted_categories[:3]
    ]
    
    return jsonify({
        'categories': top_categories,
        'careers': top_careers,
        'summary': summary,
        'total_questions': len(answers),
        'answers_breakdown': category_scores
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Server running with intelligent question routing'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)

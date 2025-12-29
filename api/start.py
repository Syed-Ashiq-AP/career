from flask import Flask, request, jsonify
import json
import os

# Load dataset
dataset_path = os.path.join(os.path.dirname(__file__), 'dataset_with_relations.json')
with open(dataset_path, 'r') as f:
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
    """
    
    # If no questions answered yet, start with the designated start question
    if not answered_questions:
        return get_question_by_id(dataset['start_question'])
    
    # Get the last question and answer
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


app = Flask(__name__)

@app.route('/api/start', methods=['POST'])
def start():
    """Vercel serverless function handler"""
    # Get first question
    first_question = select_next_question_intelligent([], {})
    
    return jsonify({
        'question': first_question,
        'total_answered': 0
    })

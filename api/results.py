from flask import Flask, request, jsonify
import json
import os
from openai import OpenAI

# Load dataset
dataset_path = os.path.join(os.path.dirname(__file__), 'dataset_with_relations.json')
with open(dataset_path, 'r') as f:
    dataset = json.load(f)

# Initialize Perplexity client
perplexity_client = OpenAI(
    api_key=os.getenv('PERPLEXITY_API_KEY', ''),
    base_url="https://api.perplexity.ai"
)


app = Flask(__name__)

@app.route('/api/results', methods=['POST'])
def results():
    """Vercel serverless function handler"""
    data = request.get_json()
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

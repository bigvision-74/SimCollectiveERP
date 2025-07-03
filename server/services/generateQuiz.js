const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateQuiz = async (paragraph, questionCount = 4, questionType = '1') => {
  let prompt = '';
  const type = parseInt(questionType);
  if (type == 3) {
    // Multiple Choice (multiple correct answers)
    prompt = `
      Generate ${questionCount} multiple-choice questions with potentially MORE THAN ONE correct answer based on the following paragraph.
  
      Each question must include:
      - A "question" field (the question text).
      - An "options" field with four answer choices: "1", "2", "3", "4".
      - An "answer" field:
        - Return ALL correct options as an array of strings (e.g., ["1", "3"]).
      ***DO NOT assume only one correct answer.***
      ***DO NOT guess. Only mark answers as correct if the paragraph clearly supports them.***
      ***DO NOT include any explanations. Only output the raw JSON.***
  
      Paragraph:
      """${paragraph}"""
  
      Output format:
      [
        {
          "question": "Which of the following statements are correct?",
          "options": {
            "1": "Option 1",
            "2": "Option 2",
            "3": "Option 3",
            "4": "Option 4"
          },
          "answer": ["1", "3"]
        }
      ]
    `;
  } else if (type == 2) {
    // Single Choice
    prompt = `
      Generate ${questionCount} single-choice questions (only ONE correct answer) based on the following paragraph.
  
      Each question must include:
      - A "question" field.
      - An "options" field with four answer choices: "1", "2", "3", "4".
      - An "answer" field:
        - Return the SINGLE correct option as a string (e.g., "2").
      ***DO NOT include multiple correct answers or true/false questions.***
      ***DO NOT include explanations. Only output raw JSON.***
  
      Paragraph:
      """${paragraph}"""
  
      Output format:
      [
        {
          "question": "What is the correct answer?",
          "options": {
            "1": "Option 1",
            "2": "Option 2",
            "3": "Option 3",
            "4": "Option 4"
          },
          "answer": "2"
        }
      ]
    `;
  } else if (type == 1) {
    // True/False
    prompt = `
      Generate ${questionCount} true/false questions based strictly on the following paragraph.
  
      Each question must include:
      - A "question" field.
      - An "options" field with two choices: "1": "True", "2": "False".
      - An "answer" field:
        - Must be either "1" or "2", representing True or False.
  
      ***Only use facts that are clearly supported or contradicted by the paragraph.***
      ***DO NOT include explanations. Only output raw JSON.***
  
      Paragraph:
      """${paragraph}"""
  
      Output format:
      [
        {
          "question": "The sun rises in the east.",
          "options": {
            "1": "True",
            "2": "False"
          },
          "answer": "1"
        }
      ]
    `;
  } else if (type == 4) {
    // Mixed Types
    prompt = `
      Generate ${questionCount} mixed-type questions (a combination of true/false, single-choice, and multiple-choice) based on the following paragraph.
  
      Distribute question types randomly. Each question must follow one of these formats:
  
      1. **True/False Question**
        {
          "question": "The sky is blue.",
          "options": {
            "1": "True",
            "2": "False"
          },
          "answer": "1"
        }
  
      2. **Single-choice Question**
        {
          "question": "What color is the sky?",
          "options": {
            "1": "Green",
            "2": "Blue",
            "3": "Red",
            "4": "Yellow"
          },
          "answer": "2"
        }
  
      3. **Multiple-choice Question (multiple correct answers)**
        {
          "question": "Which of the following are colors?",
          "options": {
            "1": "Blue",
            "2": "Cat",
            "3": "Green",
            "4": "Table"
          },
          "answer": ["1", "3"]
        }
  
      ***DO NOT explain anything. Only output raw JSON.***
      ***Each question must clearly reflect facts from the paragraph.***
  
      Paragraph:
      """${paragraph}"""
  
      Output format:
      [
        {
          "question": "Sample mixed question",
          "options": {
            "1": "Option 1",
            "2": "Option 2",
            "3": "Option 3",
            "4": "Option 4"
          },
          "answer": "3"
        },
        {
          "question": "Sample true/false",
          "options": {
            "1": "True",
            "2": "False"
          },
          "answer": "1"
        },
        ...
      ]
    `;
  } else {
    throw new Error('Invalid question type.');
  }
  

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates quizzes with multiple correct answers.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    const cleanText = responseText.trim().replace(/^```json|```$/gim, '').trim();

    try {
      const parsed = JSON.parse(cleanText);
      return parsed;
    } catch (err) {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error('Invalid response from AI');
    }
  } catch (error) {
    console.error('Error generating quiz:', error.message);
    throw new Error('Failed to generate quiz.');
  }
};

module.exports = generateQuiz;

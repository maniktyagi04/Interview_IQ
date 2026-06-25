const { OpenAI } = require('openai');

let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Helper to invoke OpenAI or fall back to simulated response.
 */
async function callOpenAI(systemPrompt, userPrompt, mockCallback) {
  if (!openai) {
    console.log('OpenAI key missing. Using simulated response...');
    // Introduce a short artificial delay to simulate API call latency
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockCallback();
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI API Error, falling back to simulation:', error.message);
    return mockCallback();
  }
}

/**
 * Evaluates an individual interview answer.
 */
async function evaluateAnswer(questionTitle, questionDescription, userAnswer) {
  const systemPrompt = `You are an expert technical interviewer. Evaluate the user's answer to the given question.
Return your evaluation STRICTLY as a JSON object with this format:
{
  "score": 8, // Integer 1-10
  "technicalAccuracy": "Detailed explanation of what was accurate and what was missing/wrong.",
  "communicationQuality": "Feedback on clarity, phrasing, structure, and professional tone.",
  "completeness": "Whether all parts of the question description were addressed.",
  "suggestedImprovements": "Specific actionable points to improve the answer."
}`;

  const userPrompt = `Question: "${questionTitle}"
Description: "${questionDescription}"
User Answer: "${userAnswer}"`;

  return callOpenAI(systemPrompt, userPrompt, () => {
    // Highly-detailed simulated response based on length and presence of technical keywords
    const wordCount = (userAnswer || '').trim().split(/\s+/).length;
    let score = 4;
    let accuracy = 'The answer is basic and lacks deep technical substance.';
    let comms = 'The presentation is short and could use better structuring or explanation.';
    let completeness = 'Only the surface concept was mentioned. Key details were ignored.';
    let suggestions = 'Try adding code snippets, concrete examples, and discussing pros/cons.';

    if (wordCount > 60) {
      score = 8;
      accuracy = 'Good technical accuracy. Key concepts and terms were used correctly.';
      comms = 'Clear communication with structured explanation of the design patterns.';
      completeness = 'Most parts of the prompt are answered thoroughly.';
      suggestions = 'Consider mentioning edge cases and scale-related trade-offs.';
    } else if (wordCount > 30) {
      score = 6;
      accuracy = 'Moderate technical coverage. Understands the basic framework but lacks architecture details.';
      comms = 'Expressive but could use standard jargon to demonstrate industry familiarity.';
      completeness = 'Partial completion. Some sub-points were not fully explored.';
      suggestions = 'Expand on how this behavior works under the hood and provide a real-world use case.';
    }

    return {
      score,
      technicalAccuracy: accuracy,
      communicationQuality: comms,
      completeness,
      suggestedImprovements: suggestions
    };
  });
}

/**
 * Generates the overall report of the interview attempt.
 */
async function generateOverallReport(domain, difficulty, evaluations) {
  const systemPrompt = `You are a Lead Hiring Manager. Review the candidate's evaluations for their mock interview in the domain: ${domain} (Difficulty: ${difficulty}).
Generate a comprehensive feedback report.
Return your report STRICTLY as a JSON object with this format:
{
  "overallScore": 7.5, // Numeric float out of 10
  "strengths": ["list item 1", "list item 2"],
  "weaknesses": ["list item 1", "list item 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "summary": "A cohesive 2-3 sentence overview summarizing the candidate's performance."
}`;

  const userPrompt = `Evaluations list: ${JSON.stringify(evaluations)}`;

  return callOpenAI(systemPrompt, userPrompt, () => {
    const totalScore = evaluations.reduce((sum, ev) => sum + (ev.score || 0), 0);
    const avgScore = Number((totalScore / (evaluations.length || 1)).toFixed(1));

    let strengths = [
      'Demonstrated structured thinking and clear conceptual definitions.',
      'Appropriate use of basic domain concepts.'
    ];
    let weaknesses = [
      'Lacks discussion of practical edge-cases or scalability issues.',
      'Some answers could benefit from concrete examples or source configurations.'
    ];
    let suggestions = [
      'Incorporate diagrams or code listings in your conceptual explanations.',
      'Study underlying runtimes (like Event Loop, JVM, Optimizer) to explain "how" it works, not just "what" it is.',
      'Practice mock coding challenges alongside subjective reviews.'
    ];

    if (avgScore >= 8) {
      strengths.push('Excellent coverage of complex design trade-offs.');
      strengths.push('Professional coding-level articulation.');
    } else if (avgScore < 5) {
      weaknesses.push('High volume of incomplete answers.');
      suggestions.push('We recommend spending more time practicing easy-level questions before scaling difficulty.');
    }

    return {
      overallScore: avgScore,
      strengths,
      weaknesses,
      suggestions,
      summary: `The candidate demonstrated a ${avgScore >= 7.5 ? 'strong' : avgScore >= 5.5 ? 'reasonable' : 'basic'} understanding of ${domain} concepts at the ${difficulty} level. Focus on strengthening the weaknesses highlighted below to ace a real-world placement.`
    };
  });
}

/**
 * Analyzes the resume PDF contents against a target domain.
 */
async function analyzeResume(resumeText, targetDomain) {
  const systemPrompt = `You are an AI Resume Screener. Review the following parsed resume text and check its alignment against the target domain: "${targetDomain}".
Return your analysis STRICTLY as a JSON object with this format:
{
  "matchPercentage": 78, // Integer 0-100
  "keySkillsFound": ["Skill A", "Skill B"],
  "missingKeywords": ["Keyword C", "Keyword D"],
  "strengths": ["Strength 1", "Strength 2"],
  "suggestions": ["Improvement 1", "Improvement 2"],
  "verdict": "A brief summary of candidate alignment with the role."
}`;

  const userPrompt = `Resume text:
${resumeText}`;

  return callOpenAI(systemPrompt, userPrompt, () => {
    // Generate realistic review comments based on simple substring scanning
    const lowercaseText = (resumeText || '').toLowerCase();
    const skillsList = [];
    const missingList = [];
    let match = 50;

    // Scan for skills depending on domain
    const skillCheck = {
      'Frontend Development': ['react', 'javascript', 'html', 'css', 'tailwind', 'typescript', 'vue', 'nextjs', 'webpack'],
      'Backend Development': ['node', 'express', 'postgres', 'sql', 'mongodb', 'docker', 'aws', 'jwt', 'redis', 'python'],
      'Full Stack Development': ['react', 'node', 'express', 'postgres', 'sql', 'javascript', 'git', 'api', 'docker'],
      'AI/ML Engineering': ['python', 'pytorch', 'tensorflow', 'scikit', 'ml', 'nlp', 'openai', 'pandas', 'numpy', 'embeddings'],
      'Data Science': ['python', 'sql', 'pandas', 'statistics', 'numpy', 'tableau', 'excel', 'r', 'ml', 'visualization']
    };

    const targetChecks = skillCheck[targetDomain] || skillCheck['Full Stack Development'];
    targetChecks.forEach((skill) => {
      if (lowercaseText.includes(skill)) {
        skillsList.push(skill.toUpperCase());
        match += 5;
      } else {
        missingList.push(skill.toUpperCase());
      }
    });

    if (match > 95) match = 95; // cap it nicely
    if (match < 20) match = 25;

    return {
      matchPercentage: match,
      keySkillsFound: skillsList.length > 0 ? skillsList : ['GIT', 'JAVASCRIPT', 'REST APIS'],
      missingKeywords: missingList.length > 0 ? missingList : ['DOCKER', 'KUBERNETES', 'CI/CD'],
      strengths: [
        'Clear layout and logical flow in experience sections.',
        skillsList.length > 0 ? `Solid familiarity with core tools: ${skillsList.slice(0, 3).join(', ')}.` : 'Shows generic software engineering foundational knowledge.'
      ],
      suggestions: [
        `Incorporate more keywords relevant to ${targetDomain} roles (e.g. ${missingList.slice(0, 2).join(', ')}).`,
        'Quantify achievements (e.g., "Improved load speed by 30%", "reduced database load by 15%").'
      ],
      verdict: `The candidate is a ${match >= 80 ? 'strong' : match >= 55 ? 'moderate' : 'weak'} match for the ${targetDomain} role. Addressing the missing technical attributes will increase resume screening pass rates.`
    };
  });
}

/**
 * Compares resume text against a job description.
 */
async function analyzeJobMatch(resumeText, jobDescription) {
  const systemPrompt = `You are an expert AI Resume Matcher and Recruiting Specialist. Compare the candidate's resume text against the provided Job Description.
Evaluate the alignment and return a JSON object with this EXACT structure:
{
  "matchScore": 85, // Integer 0-100 representing match percentage
  "matchingSkills": ["Skill A", "Skill B"], // List of skills in the resume that match the job description
  "missingSkills": ["Skill C", "Skill D"], // List of skills in the job description that are missing from the resume
  "recommendations": ["Recommendation 1", "Recommendation 2"], // Actionable skills/topics to learn
  "strengths": ["Strength 1", "Strength 2"], // Resume strengths relative to this job description
  "weaknesses": ["Weakness 1", "Weakness 2"], // Resume weaknesses relative to this job description
  "suggestions": ["Suggestion 1", "Suggestion 2"] // Suggested improvements to tailer this resume
}`;

  const userPrompt = `Resume Text:
${resumeText}

Job Description:
${jobDescription}`;

  return callOpenAI(systemPrompt, userPrompt, () => {
    // Simulated fallback
    const resumeLow = (resumeText || '').toLowerCase();
    const jdLow = (jobDescription || '').toLowerCase();
    
    // Quick skill checking
    const keywords = ['react', 'node', 'express', 'postgresql', 'sql', 'typescript', 'javascript', 'docker', 'aws', 'python', 'git'];
    const matching = [];
    const missing = [];
    
    keywords.forEach(kw => {
      if (jdLow.includes(kw)) {
        if (resumeLow.includes(kw)) {
          matching.push(kw.toUpperCase());
        } else {
          missing.push(kw.toUpperCase());
        }
      }
    });

    if (matching.length === 0 && missing.length === 0) {
      matching.push('JAVASCRIPT', 'GIT');
      missing.push('POSTGRESQL', 'DOCKER');
    }

    const matchScore = Math.min(95, Math.max(30, Math.round((matching.length / (matching.length + missing.length || 1)) * 100)));

    return {
      matchScore,
      matchingSkills: matching,
      missingSkills: missing,
      recommendations: missing.map(m => `Learn ${m} and build a project using it.`) || ['Practice writing complex SQL queries.', 'Familiarize with cloud hosting deployment.'],
      strengths: ['Relevant technical foundations listed clearly.', 'Demonstrates knowledge of core development concepts.'],
      weaknesses: missing.length > 0 ? [`Missing references to key technologies: ${missing.join(', ')}.` ] : ['Achievements are descriptive rather than quantified.'],
      suggestions: [
        'Include a dedicated Projects section demonstrating direct application of these tools.',
        'Inject more domain-specific key phrases matching the job description requirements.'
      ]
    };
  });
}

/**
 * Generates a contextual follow-up question based on the user's initial answer.
 */
async function generateFollowUpQuestion(questionTitle, questionDescription, userAnswer) {
  const systemPrompt = `You are a professional technical interviewer. Given a question and a user's answer, generate a single, highly relevant, contextual technical follow-up question.
Do not evaluate the answer yet; only return a JSON object with this format:
{
  "followUpQuestion": "A contextual follow-up question that challenges their answer or digs deeper into a specific concept they mentioned."
}`;

  const userPrompt = `Main Question: "${questionTitle}"
Description: "${questionDescription}"
User Answer: "${userAnswer}"`;

  return callOpenAI(systemPrompt, userPrompt, () => {
    // Simulated fallback
    return {
      followUpQuestion: `In your response, you mentioned some core principles. Can you explain how you would troubleshoot or optimize this in a high-concurrency production system?`
    };
  });
}

/**
 * Evaluates the user's answer to the contextual follow-up question.
 */
async function evaluateFollowUpAnswer(questionTitle, originalAnswer, followUpQuestion, followUpAnswer) {
  const systemPrompt = `You are a Lead Technical Interviewer. Evaluate the candidate's response to the contextual follow-up question, keeping in mind the original question and their initial answer.
Assess and return scores out of 10 for: Technical Accuracy, Depth of Knowledge, Communication Quality, and Confidence Level.
Return a JSON object with this format:
{
  "score": 8, // overall score (1-10) for this follow-up answer
  "technicalScore": 7, // 1-10
  "depthScore": 8, // 1-10 (Depth of Knowledge)
  "communicationScore": 9, // 1-10 (Communication Quality)
  "confidenceScore": 8, // 1-10 (Confidence Level)
  "feedback": "A concise paragraph summarizing the evaluation of the follow-up answer."
}`;

  const userPrompt = `Main Question: "${questionTitle}"
Initial Answer: "${originalAnswer}"
Follow-up Question: "${followUpQuestion}"
Follow-up Answer: "${followUpAnswer}"`;

  return callOpenAI(systemPrompt, userPrompt, () => {
    // Simulated fallback based on word length
    const wordCount = (followUpAnswer || '').trim().split(/\s+/).length;
    let score = 5;
    let tech = 5;
    let depth = 5;
    let comm = 6;
    let conf = 7;
    let feedback = 'The candidate answered the follow-up question with limited detail, showing basic knowledge but lacking comprehensive depth.';

    if (wordCount > 50) {
      score = 9;
      tech = 9;
      depth = 8;
      comm = 9;
      conf = 9;
      feedback = 'Excellent follow-up explanation. The candidate articulated key engineering trade-offs, demonstrated high technical confidence, and addressed the concurrency/scale implications correctly.';
    } else if (wordCount > 25) {
      score = 7;
      tech = 7;
      depth = 7;
      comm = 8;
      conf = 8;
      feedback = 'Solid follow-up response. Correctly detailed the basic concept but could explain specific system architectures or debugging tools in more depth.';
    }

    return {
      score,
      technicalScore: tech,
      depthScore: depth,
      communicationScore: comm,
      confidenceScore: conf,
      feedback
    };
  });
}

/**
 * Analyzes the user's code submission and generates structural feedback/review.
 */
async function analyzeSubmissionCode(code, language, problemTitle, problemDescription, verdict, passedTests, totalTests) {
  const systemPrompt = `You are an expert technical interviewer and code reviewer. Analyze the candidate's code submission for the coding problem.
Return your evaluation STRICTLY as a JSON object with this format:
{
  "codeQualityScore": 85, // Integer 0-100 representing the clean code quality, modularity, edge cases handling, and structure.
  "timeComplexity": "O(N)", // String representing the asymptotic time complexity of the solution.
  "spaceComplexity": "O(N)", // String representing the asymptotic space complexity of the solution.
  "optimizationSuggestions": ["list item 1", "list item 2"], // Array of strings detailing specific code optimizations. If none, return empty array.
  "readabilityFeedback": "Feedback on code layout, naming conventions, comments, and readability.",
  "interviewReadinessFeedback": "Feedback on how ready this solution is for a real interview. How well could the candidate explain this, what patterns are used, and what concepts they should study."
}`;

  const userPrompt = `Problem Title: "${problemTitle}"
Problem Description: "${problemDescription}"
Language: "${language}"
Code Submitted:
\`\`\`${language}
${code}
\`\`\`
Submission Correctness Test Results:
- Verdict: ${verdict}
- Passed Tests: ${passedTests}/${totalTests}`;

  return callOpenAI(systemPrompt, userPrompt, () => {
    // Highly detailed mock fallback generator
    // Look at code properties to generate realistic complexity estimation
    let codeQualityScore = 75;
    let timeComplexity = 'O(N)';
    let spaceComplexity = 'O(1)';
    let optimizationSuggestions = [];
    let readabilityFeedback = 'The code is reasonably structured. Variable naming is clear and descriptive.';
    let interviewReadinessFeedback = 'The candidate shows a solid grasp of basic implementation. Try explaining the space/time complexity tradeoff during the introduction.';

    const hasMapOrSet = /new\s+(Map|Set)/i.test(code);
    const hasNestedLoops = /for\s*\(.*for\s*\(/.test(code.replace(/\s+/g, ' '));
    const codeLen = code.trim().length;

    if (hasNestedLoops) {
      timeComplexity = 'O(N^2)';
      optimizationSuggestions.push('Consider optimizing the nested loop to O(N) using a Hash Map or sorting if applicable.');
      codeQualityScore -= 10;
    } else if (hasMapOrSet) {
      timeComplexity = 'O(N)';
      spaceComplexity = 'O(N)';
      optimizationSuggestions.push('The time complexity is optimized to O(N) at the cost of O(N) extra space. Ensure you can explain this tradeoff to your interviewer.');
    }

    if (codeLen < 50) {
      codeQualityScore -= 15;
      readabilityFeedback = 'The solution is extremely brief. Consider structure, comments, or variable naming extensions to improve professional readability.';
    } else if (codeLen > 200) {
      codeQualityScore += 10;
      readabilityFeedback = 'Good code structure with clean logic spacing. Variable naming matches standard conventions.';
    }

    if (verdict !== 'ACCEPTED') {
      codeQualityScore = Math.max(codeQualityScore - 20, 30);
      optimizationSuggestions.push('Analyze why the test cases failed (either Wrong Answer, Runtime Error, or Timeout). Correct correctness issues first before focusing on micro-optimizations.');
      interviewReadinessFeedback = 'The code currently has failing tests. Focus on correctness and debugging techniques. Walk through dry runs of your code with simple sample inputs to catch logic errors.';
    } else {
      codeQualityScore = Math.min(codeQualityScore + 10, 100);
      optimizationSuggestions.push('The solution is fully correct and passes all test cases. Look into alternative styles or language-specific constructs to make it cleaner.');
      interviewReadinessFeedback = 'Excellent. The solution is ready for interview presentation. Practice explaining your dry-run execution on a whiteboard or virtual notepad.';
    }

    if (optimizationSuggestions.length === 0) {
      optimizationSuggestions.push('No obvious performance optimization is needed. Consider writing comments explaining the logic.');
    }

    return {
      codeQualityScore,
      timeComplexity,
      spaceComplexity,
      optimizationSuggestions,
      readabilityFeedback,
      interviewReadinessFeedback
    };
  });
}

module.exports = {
  evaluateAnswer,
  generateOverallReport,
  analyzeResume,
  analyzeJobMatch,
  generateFollowUpQuestion,
  evaluateFollowUpAnswer,
  analyzeSubmissionCode
};

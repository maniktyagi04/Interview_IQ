const prisma = require('./client');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.dailyChallenge.deleteMany({});
  await prisma.bookmark.deleteMany({});
  await prisma.contestParticipation.deleteMany({});
  await prisma.contestProblem.deleteMany({});
  await prisma.contest.deleteMany({});
  await prisma.submissionReport.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.problem.deleteMany({});
  await prisma.interviewAnswer.deleteMany({});
  await prisma.interviewReport.deleteMany({});
  await prisma.interview.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.resume.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.analytics.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const userPassword = await bcrypt.hash('user123', salt);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@interviewiq.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create Standard User
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'user@interviewiq.com',
      password: userPassword,
      role: 'USER',
    },
  });

  // Create default analytics for user
  await prisma.analytics.create({
    data: {
      userId: user.id,
      averageScore: 0.0,
      interviewsCompleted: 0,
      domainBreakdown: JSON.stringify({}),
    },
  });

  const domains = [
    'Frontend Development',
    'Backend Development',
    'Full Stack Development',
    'AI/ML Engineering',
    'Data Science'
  ];

  const difficulties = ['Easy', 'Medium', 'Hard'];

  const sampleQuestions = {
    'Frontend Development': {
      'Easy': [
        {
          title: 'What is the purpose of Semantic HTML?',
          description: 'Explain the concept of semantic HTML and list at least 3 semantic tags. Why is it important for SEO and accessibility?'
        },
        {
          title: 'Explain CSS Box Model',
          description: 'Describe content, padding, border, and margin. How does box-sizing: border-box change this layout behavior?'
        },
        {
          title: 'Explain the difference between let, const, and var',
          description: 'Detail block scope vs function scope, variable hoisting, and re-assignment constraints.'
        }
      ],
      'Medium': [
        {
          title: 'Explain React Lifecycle Methods vs Hooks',
          description: 'How do useEffect dependencies match componentDidMount, componentDidUpdate, and componentWillUnmount?'
        },
        {
          title: 'What is Event Delegation in JavaScript?',
          description: 'Explain how event bubbling allows event listeners to be attached to a parent element rather than individual child nodes.'
        },
        {
          title: 'Describe state management options in React',
          description: 'Compare Context API with external libraries like Redux or Zustand. In what scenarios is each preferred?'
        }
      ],
      'Hard': [
        {
          title: 'Explain Virtual DOM and React Reconciliation',
          description: 'Detail the diffing algorithm React uses. How do keys help, and what are O(n) rendering optimizations?'
        },
        {
          title: 'Explain Code Splitting and Lazy Loading',
          description: 'How does it improve Largest Contentful Paint (LCP)? Explain dynamic imports and React.lazy/Suspense.'
        },
        {
          title: 'What are Micro-Frontends and their challenges?',
          description: 'Discuss runtime vs build-time integration, shared state, styling conflicts, and orchestration architectures.'
        }
      ]
    },
    'Backend Development': {
      'Easy': [
        {
          title: 'What is RESTful API design?',
          description: 'Discuss HTTP methods (GET, POST, PUT, DELETE), status codes (200, 201, 400, 404, 500), and statelessness.'
        },
        {
          title: 'Difference between SQL and NoSQL databases',
          description: 'Compare schema requirements, ACID properties, relationships, and scaling characteristics.'
        },
        {
          title: 'What is CORS?',
          description: 'Explain Cross-Origin Resource Sharing. Why is it needed, and how do preflight options requests work?'
        }
      ],
      'Medium': [
        {
          title: 'Explain JWT Authentication mechanism',
          description: 'How does JWT keep sessions stateless? Explain header, payload, signature, and security rules for token storage.'
        },
        {
          title: 'What is database indexing and how does it work?',
          description: 'Detail B-Trees, how indexing speeds up SELECT queries, and its negative impact on INSERT/UPDATE operations.'
        },
        {
          title: 'Describe middleware in Express.js',
          description: 'Explain request-response flow, execution order, how next() works, and how to write custom global error handlers.'
        }
      ],
      'Hard': [
        {
          title: 'How do you handle horizontal database scaling?',
          description: 'Discuss database sharding, replication (master-slave), write/read splitting, and consistency compromises (CAP theorem).'
        },
        {
          title: 'Explain event loops and non-blocking I/O in Node.js',
          description: 'Describe the call stack, libuv thread pool, microtask queue, and phases of the event loop.'
        },
        {
          title: 'Design a rate-limiting middleware',
          description: 'Compare sliding window counter vs token bucket algorithms. How would you store state in a distributed cache like Redis?'
        }
      ]
    },
    'Full Stack Development': {
      'Easy': [
        {
          title: 'Explain MVC architecture',
          description: 'Define Model, View, and Controller and explain how they separate concerns in a web application.'
        },
        {
          title: 'What is Client-side Rendering vs Server-side Rendering?',
          description: 'Compare initial load time, SEO, server load, and dynamic routing capabilities.'
        },
        {
          title: 'Explain Cookies vs LocalStorage',
          description: 'Detail storage size limit, server availability, HttpOnly flags, and susceptibility to XSS/CSRF attacks.'
        }
      ],
      'Medium': [
        {
          title: 'How to secure cookies and prevent CSRF attacks?',
          description: 'Discuss SameSite, Secure, HttpOnly attributes, and CSRF token verification middleware.'
        },
        {
          title: 'Explain database migration strategies in production',
          description: 'How do you migrate schemas without downtime? Discuss backwards-compatibility and double writing.'
        },
        {
          title: 'How do WebSockets differ from HTTP requests?',
          description: 'Explain handshake protocol, full-duplex persistent connections, and suitable use cases.'
        }
      ],
      'Hard': [
        {
          title: 'Design a file upload service with progress tracking',
          description: 'Discuss multipart uploads, pre-signed URLs from cloud providers, and direct-to-cloud uploads to bypass server bottlenecking.'
        },
        {
          title: 'How to handle N+1 query problem with ORMs?',
          description: 'Discuss eager loading, lazy loading, joining, and batching. Explain how to detect and fix N+1 queries in Prisma.'
        },
        {
          title: 'Architect a server-side search system',
          description: 'Discuss database full-text search vs dedicated search engines (ElasticSearch/Typesense) and query caching.'
        }
      ]
    },
    'AI/ML Engineering': {
      'Easy': [
        {
          title: 'Difference between Supervised and Unsupervised Learning',
          description: 'Provide definitions, characteristics, and examples of algorithms used in both categories.'
        },
        {
          title: 'What is Overfitting and how do you prevent it?',
          description: 'Explain high variance, and discuss regularization (L1/L2), dropout, early stopping, and cross-validation.'
        },
        {
          title: 'Explain Train/Val/Test data splits',
          description: 'Why do we need separate validation and testing sets? Discuss data leakage hazards.'
        }
      ],
      'Medium': [
        {
          title: 'Explain backpropagation in neural networks',
          description: 'Detail the chain rule of calculus, gradient descent, weight updates, and activation function derivative propagation.'
        },
        {
          title: 'What is RAG (Retrieval-Augmented Generation)?',
          description: 'Detail how vector stores, embeddings, and context insertion bypass context windows and improve LLM outputs.'
        },
        {
          title: 'Describe key metric functions for evaluating classifiers',
          description: 'Compare Accuracy, Precision, Recall, F1-Score, and ROC-AUC. When should you prioritize Recall over Precision?'
        }
      ],
      'Hard': [
        {
          title: 'Explain Transformer attention mechanisms',
          description: 'Detail Scaled Dot-Product Attention, Query-Key-Value matrices, multi-head attention, and positional encoding.'
        },
        {
          title: 'How do you deploy LLMs with low latency?',
          description: 'Discuss model quantization (INT8/FP4), KV-caching, batching strategies, and engines like vLLM or TensorRT-LLM.'
        },
        {
          title: 'What is RLHF and how does it align models?',
          description: 'Discuss Reward Modelling, Proximal Policy Optimization (PPO), and Direct Preference Optimization (DPO).'
        }
      ]
    },
    'Data Science': {
      'Easy': [
        {
          title: 'What is the Central Limit Theorem?',
          description: 'State the theorem and explain its importance in hypothesis testing and constructing confidence intervals.'
        },
        {
          title: 'Difference between Correlation and Causation',
          description: 'Define both terms and explain the confounding variables concept with a real-world example.'
        },
        {
          title: 'How do you handle missing values in a dataset?',
          description: 'Discuss deletion, imputation (mean/median/mode/K-NN), and using indicator flags.'
        }
      ],
      'Medium': [
        {
          title: 'Explain Bias-Variance tradeoff',
          description: 'Detail model complexity, underfitting vs overfitting, and mathematical decomposition of mean squared error.'
        },
        {
          title: 'What are A/B tests and how do you evaluate them?',
          description: 'Discuss null hypothesis, p-values, statistical power, sample size calculation, and type I/II error thresholds.'
        },
        {
          title: 'Describe Principal Component Analysis (PCA)',
          description: 'Explain dimensionality reduction, eigenvalues, eigenvectors, and variance retention criteria.'
        }
      ],
      'Hard': [
        {
          title: 'Explain Markov Chains and transition probability matrices',
          description: 'Describe states, memoryless property (Markov property), stationary distributions, and applications.'
        },
        {
          title: 'Discuss feature selection for high-dimensional data',
          description: 'Compare Filter methods, Wrapper methods, and Embedded methods (Lasso/Ridge coefficient shrinkage).'
        },
        {
          title: 'How to build an anomaly detection system for time-series data?',
          description: 'Discuss isolation forests, rolling Z-score, autoencoders, seasonality decomposition, and dynamic thresholds.'
        }
      ]
    }
  };

  // Seed Questions
  let count = 0;
  for (const domain of domains) {
    for (const difficulty of difficulties) {
      const questions = sampleQuestions[domain][difficulty];
      for (const q of questions) {
        await prisma.question.create({
          data: {
            title: q.title,
            description: q.description,
            domain: domain,
            difficulty: difficulty,
            createdBy: admin.id
          }
        });
        count++;
      }
    }
  }

  console.log(`Successfully seeded ${count} questions.`);

  const sampleProblems = [
    {
      title: 'Two Sum',
      difficulty: 'Easy',
      description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
      starterCode: 'function twoSum(nums, target) {\n  // Write your code here\n}',
      sampleInput: '[2, 7, 11, 15], 9',
      sampleOutput: '[0, 1]',
      tags: ['Array', 'Hash Table'],
      testCases: [
        { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]', isHidden: false },
        { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]', isHidden: false },
        { input: '[3, 3], 6', expectedOutput: '[0, 1]', isHidden: true }
      ]
    },
    {
      title: 'Reverse String',
      difficulty: 'Easy',
      description: 'Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.',
      starterCode: 'function reverseString(s) {\n  // Write your code here\n  return s;\n}',
      sampleInput: '["h","e","l","l","o"]',
      sampleOutput: '["o","l","l","e","h"]',
      tags: ['String', 'Two Pointers'],
      testCases: [
        { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false },
        { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isHidden: true }
      ]
    },
    {
      title: 'Palindrome Number',
      difficulty: 'Easy',
      description: 'Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.\n\nAn integer is a palindrome when it reads the same backward as forward. For example, 121 is a palindrome while 123 is not.',
      starterCode: 'function isPalindrome(x) {\n  // Write your code here\n}',
      sampleInput: '121',
      sampleOutput: 'true',
      tags: ['Math'],
      testCases: [
        { input: '121', expectedOutput: 'true', isHidden: false },
        { input: '-121', expectedOutput: 'false', isHidden: false },
        { input: '10', expectedOutput: 'false', isHidden: true }
      ]
    },
    {
      title: 'Fibonacci Number',
      difficulty: 'Easy',
      description: 'The Fibonacci numbers, commonly denoted `F(n)` form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.\n\nGiven `n`, calculate `F(n)`.',
      starterCode: 'function fib(n) {\n  // Write your code here\n}',
      sampleInput: '4',
      sampleOutput: '3',
      tags: ['Math', 'Dynamic Programming'],
      testCases: [
        { input: '4', expectedOutput: '3', isHidden: false },
        { input: '2', expectedOutput: '1', isHidden: false },
        { input: '0', expectedOutput: '0', isHidden: true },
        { input: '9', expectedOutput: '34', isHidden: true }
      ]
    }
  ];

  for (const prob of sampleProblems) {
    const { testCases, ...problemData } = prob;
    await prisma.problem.create({
      data: {
        ...problemData,
        testCases: {
          create: testCases
        }
      }
    });
  }
  console.log(`Successfully seeded ${sampleProblems.length} coding problems.`);

  // Fetch seeded problems to associate with daily challenge and contests
  const allProblems = await prisma.problem.findMany();

  // 1. Set today's Daily Challenge
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const twoSumProblem = allProblems.find(p => p.title === 'Two Sum') || allProblems[0];
  await prisma.dailyChallenge.create({
    data: {
      problemId: twoSumProblem.id,
      date: today,
      points: 50
    }
  });
  console.log(`Set Daily Challenge to problem: ${twoSumProblem.title}`);

  // 2. Create Contests
  const now = new Date();

  // Active Contest (Starts 1 hour ago, ends in 2 hours)
  const activeStartTime = new Date(now.getTime() - 60 * 60 * 1000);
  const activeEndTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const activeContest = await prisma.contest.create({
    data: {
      title: 'Weekly Coding Contest #42',
      description: 'Test your data structures and algorithms skills against the community. Top performers win profile badges!',
      startTime: activeStartTime,
      endTime: activeEndTime,
      problems: {
        create: [
          { problemId: allProblems[0].id, points: 100, order: 1 },
          { problemId: allProblems[1].id, points: 200, order: 2 }
        ]
      }
    }
  });

  // Upcoming Contest (Starts in 3 days, ends in 3 days + 3 hours)
  const upcomingStartTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const upcomingEndTime = new Date(upcomingStartTime.getTime() + 3 * 60 * 60 * 1000);
  const upcomingContest = await prisma.contest.create({
    data: {
      title: 'Interview Prep Speedrun',
      description: 'Practice fast coding. Easy and Medium problems designed to mimic actual technical screening conditions.',
      startTime: upcomingStartTime,
      endTime: upcomingEndTime,
      problems: {
        create: [
          { problemId: allProblems[2].id, points: 100, order: 1 },
          { problemId: allProblems[3].id, points: 200, order: 2 }
        ]
      }
    }
  });

  // Past Contest (Ended 2 days ago)
  const pastStartTime = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const pastEndTime = new Date(pastStartTime.getTime() + 2 * 60 * 60 * 1000);
  const pastContest = await prisma.contest.create({
    data: {
      title: 'Algorithms Warmup 2026',
      description: 'A completed beginner-friendly competition to practice coding basics.',
      startTime: pastStartTime,
      endTime: pastEndTime,
      problems: {
        create: [
          { problemId: allProblems[0].id, points: 100, order: 1 }
        ]
      }
    }
  });
  console.log('Seeded active, upcoming, and past contests.');

  // Register user for past and active contests
  await prisma.contestParticipation.createMany({
    data: [
      { contestId: activeContest.id, userId: user.id, score: 100, finishTime: new Date(now.getTime() - 15 * 60 * 1000) },
      { contestId: pastContest.id, userId: user.id, score: 100, finishTime: new Date(pastStartTime.getTime() + 45 * 60 * 1000) }
    ]
  });

  // 3. Seed historical submissions for user to build heatmap over past 6 months
  const submissionData = [];
  const statusOptions = ['ACCEPTED', 'WRONG_ANSWER', 'COMPILE_ERROR', 'RUNTIME_ERROR'];
  
  for (let i = 0; i < 60; i++) {
    // Generate dates in the past 6 months
    const subDate = new Date();
    const daysAgo = Math.floor(Math.random() * 180);
    subDate.setDate(subDate.getDate() - daysAgo);
    
    // Pick random problem
    const randomProb = allProblems[Math.floor(Math.random() * allProblems.length)];
    const randomVerdict = Math.random() < 0.7 ? 'ACCEPTED' : statusOptions[Math.floor(Math.random() * statusOptions.length)];

    submissionData.push({
      userId: user.id,
      problemId: randomProb.id,
      code: 'console.log("Mock Submission code");',
      language: 'javascript',
      passedTests: randomVerdict === 'ACCEPTED' ? 3 : 1,
      totalTests: 3,
      verdict: randomVerdict,
      executionTime: 0.12,
      submittedAt: subDate
    });
  }

  await prisma.submission.createMany({
    data: submissionData
  });
  console.log(`Seeded ${submissionData.length} historical user submissions for heatmap.`);

  // 4. Update standard user profile points and streaks
  await prisma.user.update({
    where: { id: user.id },
    data: {
      points: 380,
      currentStreak: 5,
      longestStreak: 15,
      lastActiveDate: now
    }
  });

  // 5. Seed other users for global leaderboard
  const dummyUsers = [
    { name: 'Alice Algorithm', email: 'alice@interviewiq.com', points: 650, currentStreak: 12, longestStreak: 25 },
    { name: 'Bob Byte', email: 'bob@interviewiq.com', points: 420, currentStreak: 8, longestStreak: 18 },
    { name: 'Charlie Coder', email: 'charlie@interviewiq.com', points: 310, currentStreak: 2, longestStreak: 10 },
    { name: 'Diana Dev', email: 'diana@interviewiq.com', points: 290, currentStreak: 0, longestStreak: 9 },
    { name: 'Evan Engineer', email: 'evan@interviewiq.com', points: 150, currentStreak: 1, longestStreak: 5 }
  ];

  for (const du of dummyUsers) {
    const dummyPassword = await bcrypt.hash('user123', salt);
    await prisma.user.create({
      data: {
        ...du,
        password: dummyPassword,
        role: 'USER'
      }
    });
  }
  console.log('Seeded global leaderboard users.');

  console.log('Seeding admin: admin@interviewiq.com (password: admin123)');
  console.log('Seeding standard user: user@interviewiq.com (password: user123)');
  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

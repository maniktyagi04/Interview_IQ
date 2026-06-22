const prisma = require('./client');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Seeding database...');

  // Clean existing data
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

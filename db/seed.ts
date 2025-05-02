import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

// Helper to check if table has data
async function hasData(table: any): Promise<boolean> {
  const count = await db.select({ count: schema.users.id }).from(table);
  return count.length > 0;
}

async function seed() {
  try {
    console.log("Starting database seed...");

    // Only seed if tables are empty
    const usersExist = await hasData(schema.users);
    
    if (!usersExist) {
      console.log("Seeding users...");
      // Create sample users
      const users = [
        {
          username: "Sarah Chen",
          password: "password123", // In a real app, this would be hashed
          email: "sarah@example.com",
          bio: "Full-stack developer with a passion for AI tools",
          avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9"
        },
        {
          username: "Marcus Johnson",
          password: "password123",
          email: "marcus@example.com",
          bio: "Data scientist and ML engineer",
          avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d"
        },
        {
          username: "Alex Rivera",
          password: "password123",
          email: "alex@example.com", 
          bio: "AI researcher focused on educational applications",
          avatarUrl: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5"
        },
        {
          username: "Jordan Lee",
          password: "password123",
          email: "jordan@example.com",
          bio: "Creative coder and AI art enthusiast",
          avatarUrl: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a"
        },
        {
          username: "Emma Watson",
          password: "password123",
          email: "emma@example.com",
          bio: "Software engineer specializing in developer tools",
          avatarUrl: "https://images.unsplash.com/photo-1550525811-e5869dd03032"
        },
        {
          username: "David Kim",
          password: "password123",
          email: "david@example.com",
          bio: "NLP specialist and sentiment analysis expert",
          avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"
        },
        {
          username: "Michael Zhang",
          password: "password123", 
          email: "michael@example.com",
          bio: "Creator of AI coding assistant tools and productivity apps",
          avatarUrl: "https://images.unsplash.com/photo-1599658880436-c61792e70672"
        }
      ];

      for (const user of users) {
        await db.insert(schema.users).values(user);
      }
      
      console.log("Seeding tags...");
      // Create tags
      const tagsList = [
        "AI Tools", "Productivity", "Code", "Data Viz", "Analytics", 
        "ML", "Education", "Chatbots", "GPT", "Creative", "Image Gen", 
        "Art", "Development", "Tools", "Business", "NLP"
      ];
      
      for (const tagName of tagsList) {
        await db.insert(schema.tags).values({ name: tagName });
      }
      
      console.log("Seeding projects...");
      // Define projects
      const projectsData = [
        {
          title: "AI Code Generator Pro",
          description: "Generate production-ready code with AI assistance. Supports multiple languages and frameworks.",
          longDescription: `
            <p>AI Code Generator Pro is a powerful tool designed to help developers write cleaner, more efficient code faster than ever before. By leveraging the latest advances in AI and machine learning, it can generate production-ready code from simple natural language descriptions.</p>
            <p>The tool supports multiple programming languages including JavaScript, Python, Java, C#, and more. It can generate complete functions, classes, or even entire modules based on your specifications.</p>
            <p>Key features include:</p>
            <ul>
              <li>Natural language to code generation</li>
              <li>Multi-language support</li>
              <li>Code explanation and documentation generation</li>
              <li>Integration with popular IDEs</li>
              <li>Customizable output style</li>
            </ul>
            <p>This project was built using OpenAI's GPT models with custom fine-tuning for code generation tasks, wrapped in a user-friendly interface that makes it accessible to developers of all skill levels.</p>
          `,
          projectUrl: "https://aicodegenerator.pro",
          imageUrl: "https://images.unsplash.com/photo-1607798748738-b15c40d33d57",
          authorId: 1, // Sarah Chen
          viewsCount: 145,
          featured: false
        },
        {
          title: "AI Data Analyzer",
          description: "Transform complex datasets into actionable insights with this AI-powered data analysis tool.",
          longDescription: `
            <p>AI Data Analyzer is a comprehensive data analysis platform that helps you make sense of your data without requiring advanced technical knowledge. It uses machine learning algorithms to automatically identify patterns, anomalies, and insights within your datasets.</p>
            <p>The tool offers an intuitive interface for uploading, cleaning, analyzing, and visualizing data. It can handle various data formats including CSV, Excel, JSON, and SQL databases.</p>
            <p>Key features include:</p>
            <ul>
              <li>Automated data cleaning and preprocessing</li>
              <li>Intelligent pattern recognition</li>
              <li>Interactive visualization dashboard</li>
              <li>Natural language insights and recommendations</li>
              <li>Export options for reports and presentations</li>
            </ul>
          `,
          projectUrl: "https://aidataanalyzer.com",
          imageUrl: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb",
          authorId: 2, // Marcus Johnson
          viewsCount: 89,
          featured: false
        },
        {
          title: "ChatGPT Tutor",
          description: "Personalized learning assistant powered by ChatGPT for students of all ages and subjects.",
          longDescription: `
            <p>ChatGPT Tutor is an educational platform that leverages the power of GPT models to provide personalized learning experiences. It adapts to each student's learning style, pace, and needs to deliver customized educational content and support.</p>
            <p>The platform covers a wide range of subjects from mathematics and science to language arts and social studies. It can explain concepts, answer questions, provide practice problems, and offer feedback on student work.</p>
            <p>Key features include:</p>
            <ul>
              <li>Subject-specific tutoring across K-12 and college levels</li>
              <li>Adaptive learning paths based on student performance</li>
              <li>Interactive exercises and quizzes</li>
              <li>Progress tracking and detailed reports</li>
              <li>Parent and teacher dashboards</li>
            </ul>
          `,
          projectUrl: "https://chatgpttutor.edu",
          imageUrl: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a",
          authorId: 3, // Alex Rivera
          viewsCount: 213,
          featured: false
        },
        {
          title: "DreamCanvas AI",
          description: "Create stunning artwork from text prompts with this AI image generation tool.",
          longDescription: `
            <p>DreamCanvas AI transforms your text descriptions into beautiful, unique images using state-of-the-art AI image generation models. Whether you're a professional artist looking for inspiration or someone with no artistic experience, DreamCanvas helps you bring your imagination to life.</p>
            <p>The tool offers various styles and customization options, allowing you to generate everything from photorealistic images to abstract art, anime, or oil paintings. You can further refine images with additional prompts and adjustments.</p>
            <p>Key features include:</p>
            <ul>
              <li>Text-to-image generation with detailed control</li>
              <li>Multiple artistic styles and presets</li>
              <li>High-resolution output suitable for printing</li>
              <li>Editing and refinement tools</li>
              <li>Gallery and collection management</li>
            </ul>
          `,
          projectUrl: "https://dreamcanvas.ai",
          imageUrl: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356",
          authorId: 4, // Jordan Lee
          viewsCount: 178,
          featured: false
        },
        {
          title: "DevAssist AI",
          description: "A smart assistant that helps developers with code suggestions, bug fixing, and optimization.",
          longDescription: `
            <p>DevAssist AI is a comprehensive development assistant that integrates with your IDE to provide intelligent code suggestions, identify and fix bugs, and optimize your code for performance and readability. It learns from your coding patterns to provide increasingly relevant assistance over time.</p>
            <p>The tool supports multiple programming languages and frameworks, making it versatile for full-stack development, data science, mobile app development, and more.</p>
            <p>Key features include:</p>
            <ul>
              <li>Context-aware code completion and generation</li>
              <li>Automated bug detection and fixing</li>
              <li>Code optimization recommendations</li>
              <li>Documentation assistance</li>
              <li>Integration with GitHub, GitLab, and other version control systems</li>
            </ul>
          `,
          projectUrl: "https://devassist.ai",
          imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
          authorId: 5, // Emma Watson
          viewsCount: 136,
          featured: false
        },
        {
          title: "SentimentScope",
          description: "Analyze customer feedback with this powerful sentiment analysis tool powered by AI.",
          longDescription: `
            <p>SentimentScope is an advanced sentiment analysis platform designed to help businesses understand customer feedback at scale. It uses natural language processing and machine learning to analyze text from reviews, surveys, social media, and support tickets.</p>
            <p>The tool goes beyond basic positive/negative classification to identify specific themes, emotions, and actionable insights from customer feedback. It can process feedback in multiple languages and present results in clear, interactive dashboards.</p>
            <p>Key features include:</p>
            <ul>
              <li>Multi-dimensional sentiment analysis (positive/negative/neutral)</li>
              <li>Emotion detection (joy, anger, sadness, surprise, etc.)</li>
              <li>Topic and theme extraction</li>
              <li>Trend analysis and change over time</li>
              <li>Competitive benchmarking</li>
            </ul>
          `,
          projectUrl: "https://sentimentscope.io",
          imageUrl: "https://images.unsplash.com/photo-1535016120720-40c646be5580",
          authorId: 6, // David Kim
          viewsCount: 92,
          featured: false
        },
        {
          title: "CodePilot AI",
          description: "An intelligent coding assistant that learns your coding style and helps you write better code faster.",
          longDescription: `
            <p>CodePilot AI is an intelligent coding assistant that learns your coding style and helps you write better code faster. It integrates with your favorite IDEs and suggests improvements, refactors, and optimizations as you code.</p>
            <p>Unlike standard code completion tools, CodePilot AI understands the broader context of your project, your personal coding patterns, and best practices for your specific framework or language. It adapts to your style while gently nudging you toward more efficient, readable, and maintainable code.</p>
            <p>Key features include:</p>
            <ul>
              <li>Personalized code suggestions based on your coding style</li>
              <li>Smart refactoring recommendations</li>
              <li>Performance optimization insights</li>
              <li>Architecture pattern recognition and suggestions</li>
              <li>Learning mode that improves with your feedback</li>
              <li>Support for over 20 programming languages and frameworks</li>
            </ul>
            <p>CodePilot AI serves as both a productivity tool and a learning companion, helping developers of all skill levels write cleaner, more efficient code while developing better habits and deeper understanding.</p>
          `,
          projectUrl: "https://codepilot.ai",
          imageUrl: "https://images.unsplash.com/photo-1599658880436-c61792e70672",
          authorId: 7, // Michael Zhang
          viewsCount: 487,
          featured: true
        }
      ];
      
      // Insert projects and associate tags
      for (const projectData of projectsData) {
        const [project] = await db.insert(schema.projects).values(projectData).returning();
        
        // Associate tags based on the project
        let projectTags: string[] = [];
        switch(project.title) {
          case "AI Code Generator Pro":
            projectTags = ["AI Tools", "Productivity", "Code"];
            break;
          case "AI Data Analyzer":
            projectTags = ["Data Viz", "Analytics", "ML"];
            break;
          case "ChatGPT Tutor":
            projectTags = ["Education", "Chatbots", "GPT"];
            break;
          case "DreamCanvas AI":
            projectTags = ["Creative", "Image Gen", "Art"];
            break;
          case "DevAssist AI":
            projectTags = ["Development", "Productivity", "Tools"];
            break;
          case "SentimentScope":
            projectTags = ["Business", "Analytics", "NLP"];
            break;
          case "CodePilot AI":
            projectTags = ["AI Tools", "Development", "Productivity", "Code"];
            break;
        }
        
        for (const tagName of projectTags) {
          // Get tag ID
          const tag = await db.query.tags.findFirst({
            where: eq(schema.tags.name, tagName)
          });
          
          if (tag) {
            // Create association
            await db.insert(schema.projectTags).values({
              projectId: project.id,
              tagId: tag.id
            });
          }
        }
      }
      
      console.log("Seeding comments...");
      // Add some comments
      const comments = [
        {
          projectId: 1, // AI Code Generator Pro
          authorId: 2, // Marcus Johnson
          content: "This is incredible! I've been using it for a week now and it's already saved me hours of coding time. The JavaScript code it generates is clean and follows best practices."
        },
        {
          projectId: 1, // AI Code Generator Pro
          authorId: 6, // David Kim
          content: "Does it work well with TypeScript? I'm looking for something that can handle type definitions correctly."
        },
        {
          projectId: 1, // AI Code Generator Pro
          authorId: 3, // Alex Rivera
          content: "The documentation generation feature is a game-changer. It saved me so much time on my last project. Would love to see more customization options for the documentation style in the future."
        },
        {
          projectId: 7, // CodePilot AI (featured project)
          authorId: 1, // Sarah Chen
          content: "I'm amazed at how quickly it adapts to my coding style. Within a few hours of use, it was already making suggestions that felt like they came from a teammate who knows my preferences."
        },
        {
          projectId: 7, // CodePilot AI (featured project)
          authorId: 5, // Emma Watson
          content: "The performance optimization suggestions have been eye-opening. It helped me identify several bottlenecks in my React application that I had completely missed."
        }
      ];
      
      for (const comment of comments) {
        await db.insert(schema.comments).values(comment);
      }
      
      // Add some replies
      const commentWithReply = await db.query.comments.findFirst({
        where: eq(schema.comments.content, "Does it work well with TypeScript? I'm looking for something that can handle type definitions correctly.")
      });
      
      if (commentWithReply) {
        await db.insert(schema.commentReplies).values({
          commentId: commentWithReply.id,
          authorId: 1, // Sarah Chen (the project creator)
          content: "Yes! TypeScript support is one of our priorities. The tool generates proper type definitions and interfaces. It's especially good at inferring complex types from usage patterns."
        });
      }
      
      console.log("Seeding likes...");
      // Add some likes to projects
      const projectLikes = [
        { projectId: 1, userId: 2 }, // Marcus likes AI Code Generator Pro
        { projectId: 1, userId: 3 }, // Alex likes AI Code Generator Pro
        { projectId: 1, userId: 5 }, // Emma likes AI Code Generator Pro
        { projectId: 2, userId: 1 }, // Sarah likes AI Data Analyzer
        { projectId: 2, userId: 3 }, // Alex likes AI Data Analyzer
        { projectId: 3, userId: 1 }, // Sarah likes ChatGPT Tutor
        { projectId: 3, userId: 2 }, // Marcus likes ChatGPT Tutor
        { projectId: 3, userId: 5 }, // Emma likes ChatGPT Tutor
        { projectId: 3, userId: 6 }, // David likes ChatGPT Tutor
        { projectId: 7, userId: 1 }, // Sarah likes CodePilot AI
        { projectId: 7, userId: 2 }, // Marcus likes CodePilot AI
        { projectId: 7, userId: 3 }, // Alex likes CodePilot AI
        { projectId: 7, userId: 4 }, // Jordan likes CodePilot AI
        { projectId: 7, userId: 5 }, // Emma likes CodePilot AI
        { projectId: 7, userId: 6 }  // David likes CodePilot AI
      ];
      
      for (const like of projectLikes) {
        await db.insert(schema.likes).values({
          projectId: like.projectId,
          userId: like.userId,
          commentId: null,
          replyId: null
        });
      }
      
      // Add some likes to comments
      const commentsToLike = await db.query.comments.findMany({
        limit: 5
      });
      
      for (const comment of commentsToLike) {
        // Add 1-3 random likes to each comment
        const likesCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 1; i <= likesCount; i++) {
          const userId = (i % 6) + 1; // Users 1-6
          await db.insert(schema.likes).values({
            commentId: comment.id,
            userId,
            projectId: null,
            replyId: null
          });
        }
      }
      
      // Add some likes to replies
      const repliesToLike = await db.query.commentReplies.findMany();
      
      for (const reply of repliesToLike) {
        // Add 1-2 random likes to each reply
        const likesCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 1; i <= likesCount; i++) {
          const userId = ((i + 2) % 6) + 1; // Different pattern than comments
          await db.insert(schema.likes).values({
            replyId: reply.id,
            userId,
            projectId: null,
            commentId: null
          });
        }
      }

      console.log("Database seed completed successfully!");
    } else {
      console.log("Database already contains data, skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();

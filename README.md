
# Ctrl Alt Vibe

A cutting-edge community platform that leverages AI to empower developers in discovering, collaborating, and showcasing innovative coding projects. This platform combines modern web technologies with AI-powered tools to provide comprehensive project evaluation and community engagement.

Built with React, Express, PostgreSQL, and OpenAI integration for intelligent project evaluation.

## Features

- **Project Showcase**: Share and discover creative projects
- **Vibe Check**: AI-powered project evaluation tool with real-time counter showing total projects analyzed
- **Blog System**: Rich text editor for creating and managing blog posts
- **User Authentication**: Secure login with email or Google authentication
- **Real-time Notifications**: WebSocket-powered notification system
- **Comments & Interactions**: Engage with other users' projects
- **Admin Dashboard**: Manage users, content, and site analytics
- **Responsive Design**: Mobile-first UI built with Tailwind CSS
- **Accessibility**: WCAG 2.1 Level AA compliant
- **Image Management**: Upload and optimize project images
- **SEO Optimization**: Built-in SEO components and sitemap generation

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: React Query
- **Real-time**: WebSocket
- **AI Integration**: OpenAI GPT-4o for Vibe Check analysis
- **Authentication**: Passport.js, Google OAuth
- **Testing**: Jest, React Testing Library
- **Image Processing**: Sharp
- **Editor**: TipTap

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npm run db:push
npm run db:seed
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://0.0.0.0:5000`

## Project Structure

```
├── client/           # Frontend React application
│   ├── src/          # Source code
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Library code and utilities
│   │   ├── pages/       # Page components
│   │   ├── types/       # TypeScript type definitions
│   │   └── utils/       # Utility functions
├── server/           # Backend Express server
│   ├── routes/       # API routes organized by feature
│   ├── services/     # Business logic and external services
│   ├── middleware/   # Express middleware
│   └── utils/        # Server utilities
├── db/              # Database schemas and migrations
├── shared/          # Shared types and utilities
├── __tests__/       # Test suites
└── public/          # Static assets
```

## Testing

Run the test suite:

```bash
npm test             # Run all tests
npm run test:client  # Run frontend tests
npm run test:server  # Run backend tests
```

## Code Organization

The project follows a modular architecture with clear separation of concerns:

### Backend Architecture
- **Routes**: Feature-based API endpoints organized by domain area
- **Services**: Business logic layer implementing core functionality
- **Middleware**: Cross-cutting concerns like authentication and error handling
- **Utils**: Reusable helper functions for common tasks
- **Database**: SQL schema definitions and Drizzle ORM integration

### Frontend Architecture
- **Components**: Reusable UI components with Shadcn/UI integration
- **Pages**: Main application views and routes
- **Hooks**: Custom React hooks for shared logic
- **Query Client**: TanStack Query for data fetching and caching
- **Utils**: Helper functions for frontend-specific tasks

See [CODE_ORGANIZATION.md](./CODE_ORGANIZATION.md) for detailed information about the code structure and architectural decisions.

## Contributing

1. Follow the code style and organization
2. Write tests for new features
3. Update documentation as needed
4. Create descriptive commit messages

## License

MIT License - see LICENSE file for details

## Contact

For support or questions, email: support@ctrlaltvibe.com

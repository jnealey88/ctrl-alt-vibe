import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShareButton } from '../../client/src/components/ShareButton';

// Mock modules
jest.mock('../../client/src/lib/queryClient', () => ({
  apiRequest: jest.fn().mockImplementation(async () => ({
    json: () => Promise.resolve({})
  })),
  queryClient: {
    invalidateQueries: jest.fn()
  }
}));

jest.mock('react-share', () => ({
  TwitterShareButton: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="twitter-share-button">{children}</button>
  ),
  FacebookShareButton: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="facebook-share-button">{children}</button>
  ),
  LinkedinShareButton: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="linkedin-share-button">{children}</button>
  ),
  EmailShareButton: ({ children }: { children: React.ReactNode }) => (
    <button data-testid="email-share-button">{children}</button>
  ),
  TwitterIcon: () => <div data-testid="twitter-icon" />,
  FacebookIcon: () => <div data-testid="facebook-icon" />,
  LinkedinIcon: () => <div data-testid="linkedin-icon" />,
  EmailIcon: () => <div data-testid="email-icon" />
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Import after mocking
import { apiRequest, queryClient } from '../../client/src/lib/queryClient';

// Create a wrapper component with the QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ShareButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render share button in collapsed state initially', () => {
    render(
      <ShareButton 
        projectId={1} 
        sharesCount={10} 
        isAuthenticated={true} 
        url="https://example.com/project/1"
      />,
      { wrapper: createWrapper() }
    );

    // Should show the share button and count
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    // Share options should not be visible initially
    expect(screen.queryByTestId('twitter-share-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('facebook-share-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('linkedin-share-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('email-share-button')).not.toBeInTheDocument();
  });

  it('should expand share options when clicked', async () => {
    render(
      <ShareButton 
        projectId={1} 
        sharesCount={10} 
        isAuthenticated={true} 
        url="https://example.com/project/1"
      />,
      { wrapper: createWrapper() }
    );

    // Click the share button
    await userEvent.click(screen.getByText('Share'));

    // Share options should now be visible
    expect(screen.getByTestId('twitter-share-button')).toBeInTheDocument();
    expect(screen.getByTestId('facebook-share-button')).toBeInTheDocument();
    expect(screen.getByTestId('linkedin-share-button')).toBeInTheDocument();
    expect(screen.getByTestId('email-share-button')).toBeInTheDocument();
  });

  it('should track share when a platform button is clicked', async () => {
    render(
      <ShareButton 
        projectId={1} 
        sharesCount={10} 
        isAuthenticated={true} 
        url="https://example.com/project/1"
      />,
      { wrapper: createWrapper() }
    );

    // Click the share button to expand options
    await userEvent.click(screen.getByText('Share'));

    // Click a share platform button
    await userEvent.click(screen.getByTestId('twitter-share-button'));

    // Should call API to track the share
    expect(apiRequest).toHaveBeenCalledWith(
      'POST',
      '/api/projects/1/share',
      { platform: 'twitter' }
    );

    // Should invalidate queries to refresh share count
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/api/projects']
    });
  });

  it('should show auth dialog when unauthenticated user tries to share', async () => {
    render(
      <ShareButton 
        projectId={1} 
        sharesCount={5} 
        isAuthenticated={false} 
        url="https://example.com/project/1"
      />,
      { wrapper: createWrapper() }
    );

    // Click the share button
    await userEvent.click(screen.getByText('Share'));

    // Auth dialog should be shown
    await waitFor(() => {
      expect(screen.getByText('Sign in required')).toBeInTheDocument();
      expect(screen.getByText(/You need to be signed in/i)).toBeInTheDocument();
    });

    // Share options should not be visible
    expect(screen.queryByTestId('twitter-share-button')).not.toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Mock API to throw an error
    (apiRequest as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <ShareButton 
        projectId={1} 
        sharesCount={10} 
        isAuthenticated={true} 
        url="https://example.com/project/1"
      />,
      { wrapper: createWrapper() }
    );

    // Click the share button to expand options
    await userEvent.click(screen.getByText('Share'));

    // Click a share platform button
    await userEvent.click(screen.getByTestId('twitter-share-button'));

    // API should be called but fail
    expect(apiRequest).toHaveBeenCalled();
    
    // Query invalidation should not happen on error
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('should close expanded menu when clicking outside', async () => {
    render(
      <div>
        <div data-testid="outside-element">Outside Element</div>
        <ShareButton 
          projectId={1} 
          sharesCount={10} 
          isAuthenticated={true} 
          url="https://example.com/project/1"
        />
      </div>,
      { wrapper: createWrapper() }
    );

    // Click the share button to expand options
    await userEvent.click(screen.getByText('Share'));

    // Share options should be visible
    expect(screen.getByTestId('twitter-share-button')).toBeInTheDocument();

    // Click outside
    await userEvent.click(screen.getByTestId('outside-element'));

    // Share options should now be hidden
    await waitFor(() => {
      expect(screen.queryByTestId('twitter-share-button')).not.toBeInTheDocument();
    });
  });

  it('should handle zero shares count properly', () => {
    render(
      <ShareButton 
        projectId={1} 
        sharesCount={0} 
        isAuthenticated={true} 
        url="https://example.com/project/1"
      />,
      { wrapper: createWrapper() }
    );

    // Should show the share button and count
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

import React, { ErrorInfo } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../../client/src/components/ErrorBoundary';

// Create a component that throws an error when a prop is true
const ErrorThrowingComponent = ({ shouldThrow = false, message = 'Test error' }: { shouldThrow?: boolean, message?: string }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>No error thrown</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error during tests
  const originalConsoleError = console.error;
  
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalConsoleError;
  });
  
  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
  
  it('should render fallback UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // Check for the default error message
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    // Check for the reset button
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
  });
  
  it('should render custom fallback UI if provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error UI</div>}>
        <ErrorThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });
  
  it('should display specific error message', () => {
    const errorMessage = 'Specific test error message';
    
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={true} message={errorMessage} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
  });
  
  it('should call onError prop when an error occurs', () => {
    const onErrorMock = jest.fn();
    const errorMessage = 'Test error for callback';
    
    render(
      <ErrorBoundary onError={onErrorMock}>
        <ErrorThrowingComponent shouldThrow={true} message={errorMessage} />
      </ErrorBoundary>
    );
    
    expect(onErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: errorMessage }),
      expect.any(Object) // ErrorInfo object
    );
  });
  
  it('should reset and render children again after clicking the reset button', async () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      return (
        <div>
          <button onClick={() => setShouldThrow(false)}>Fix error</button>
          <ErrorBoundary>
            {shouldThrow ? 
              <ErrorThrowingComponent shouldThrow={true} /> :
              <div>Error fixed</div>
            }
          </ErrorBoundary>
        </div>
      );
    };
    
    render(<TestComponent />);
    
    // First, we should see the error UI
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    
    // Click the reset button within the ErrorBoundary
    const resetButton = screen.getByRole('button', { name: /Try again/i });
    await userEvent.click(resetButton);
    
    // The error should be thrown again because we haven't fixed the root cause
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    
    // Now fix the error
    const fixButton = screen.getByRole('button', { name: /Fix error/i });
    await userEvent.click(fixButton);
    
    // Click reset again
    await userEvent.click(screen.getByRole('button', { name: /Try again/i }));
    
    // Now we should see the fixed content
    expect(screen.getByText('Error fixed')).toBeInTheDocument();
  });
  
  it('should handle nested errors', () => {
    render(
      <ErrorBoundary fallback={<div>Outer Error Boundary</div>}>
        <div>Outer Content</div>
        <ErrorBoundary fallback={<div>Inner Error Boundary</div>}>
          <ErrorThrowingComponent shouldThrow={true} message="Inner component error" />
        </ErrorBoundary>
      </ErrorBoundary>
    );
    
    // The inner error boundary should catch the error
    expect(screen.getByText('Inner Error Boundary')).toBeInTheDocument();
    // The outer content should still be visible
    expect(screen.getByText('Outer Content')).toBeInTheDocument();
    // The outer error boundary fallback should not be displayed
    expect(screen.queryByText('Outer Error Boundary')).not.toBeInTheDocument();
  });
});

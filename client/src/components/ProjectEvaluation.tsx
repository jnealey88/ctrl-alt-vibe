import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3Icon, 
  UsersIcon, 
  TrendingUpIcon, 
  LightbulbIcon, 
  ShieldIcon, 
  CodeIcon, 
  ScrollTextIcon, 
  HeartHandshakeIcon,
  BarChart4Icon,
  ChevronRightIcon,
  PieChartIcon,
  TargetIcon,
  GlobeIcon,
  InfoIcon,
  RocketIcon,
  CircleDollarSignIcon,
  WrenchIcon
} from 'lucide-react';

interface ProjectEvaluationProps {
  projectId: number;
  isOwner: boolean;
  isAdminUser?: boolean;
}

export default function ProjectEvaluation({ projectId, isOwner, isAdminUser = false }: ProjectEvaluationProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('market-fit');
  const [isGenerating, setIsGenerating] = useState(false);

  // Define response types for better TypeScript support
  interface ProjectEvaluationResponse {
    evaluation: {
      id?: number;
      projectId?: number;
      marketFitAnalysis?: {
        strengths: string[];
        weaknesses: string[];
        demandPotential: string;
      };
      targetAudience?: {
        demographic: string;
        psychographic: string;
      };
      fitScore: number;
      fitScoreExplanation: string;
      businessPlan?: {
        revenueModel: string;
        goToMarket: string;
        milestones: string[];
      };
      valueProposition: string;
      riskAssessment?: {
        risks: Array<{
          type: string;
          description: string;
          mitigation: string;
        }>;
      };
      technicalFeasibility?: string;
      regulatoryConsiderations?: string;
      partnershipOpportunities?: {
        partners: string[];
      };
      competitiveLandscape?: {
        competitors: Array<{
          name: string;
          differentiation: string;
        }>;
      };
      implementationRoadmap?: {
        phases: Array<{
          timeframe: string;
          tasks: string[];
          metrics: string[];
        }>;
      };
      // Enhanced business guidance sections
      launchStrategy?: {
        mvpFeatures: string[];
        timeToMarket: string;
        marketEntryApproach: string;
        criticalResources: string[];
        launchChecklist: string[];
      };
      customerAcquisition?: {
        primaryChannels: string[];
        acquisitionCost: string;
        conversionStrategy: string;
        retentionTactics: string[];
        growthOpportunities: string;
      };
      revenueGeneration?: {
        businessModels: string[];
        pricingStrategy: string;
        revenueStreams: string[];
        unitEconomics: string;
        scalingPotential: string;
      };
      bootstrappingGuide?: {
        costMinimizationTips: string[];
        diySolutions: string;
        growthWithoutFunding: string;
        timeManagement: string;
        milestonesOnBudget: string[];
      };
    } | null;
    error?: string;
    isAdmin?: boolean;
  }

  // We need evaluation data for owners and potentially admins
  const { 
    data: ownerData, 
    isLoading,
    refetch: refetchOwner
  } = useQuery<ProjectEvaluationResponse>({
    queryKey: [`/api/ai/project-evaluation/${projectId}`],
    retry: false,
    enabled: true, // Always fetch to check for admin rights and evaluation data
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: 'always' // Always refetch when window gains focus
  });
  
  // Check if user is admin based on response from API or from prop
  const isAdmin = isAdminUser || ownerData?.isAdmin === true;

  // Get evaluation data
  const evaluation = ownerData?.evaluation;
  const isError = ownerData?.error;

  // Direct fetch from file path (for potential static generation)
  useEffect(() => {
    // If no data is available from either query, try a direct fetch
    if (!evaluation && !isLoading) {
      console.log('Component mounted, fetching direct data for project:', projectId);
      const checkStaticFile = async () => {
        try {
          console.log(`Attempting direct fetch from /evaluation-data/${projectId}`);
          const response = await fetch(`/evaluation-data/${projectId}`);
          console.log('Direct fetch response status:', response.status);
          
          if (response.status === 200) {
            const text = await response.text();
            console.log('Direct fetch raw response:', text.substring(0, 100) + '...');
            
            try {
              const json = JSON.parse(text);
              // Handle static file data if needed
            } catch (e) {
              console.log('Error or no evaluation:', { isError: true, error: e });
            }
          }
        } catch (err) {
          console.log('Error or no evaluation:', { isError: true, error: err });
        }
      };
      
      checkStaticFile();
    }
  }, [projectId, evaluation, isLoading]);

  // Generate Vibe Check evaluation when requested by owner or admin
  const generateEvaluation = async (regenerate = false) => {
    // Allow both owners and admins to generate evaluations
    if (!isOwner && !isAdmin) return;
    
    setIsGenerating(true);
    console.log(`${regenerate ? 'Regenerating' : 'Generating'} Vibe Check for project:`, projectId);
    
    try {
      // Get project data first to pass to Vibe Check
      console.log('Fetching project data for Vibe Check generation');
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      
      if (!projectResponse.ok) {
        throw new Error('Failed to fetch project data');
      }
      
      const projectData = await projectResponse.json();
      console.log('Project data retrieved for Vibe Check:', projectData);
      
      // Create a Vibe Check using the project description
      console.log('Starting Vibe Check generation for project:', projectId);
      
      // Get reCAPTCHA token - using a dummy value as we're authenticated
      const recaptchaToken = "authenticated-user-token";
      
      const response = await fetch('/api/vibe-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          projectDescription: projectData.longDescription || projectData.description,
          websiteUrl: projectData.projectUrl || '',
          email: '',
          recaptchaToken: recaptchaToken
        }),
      });
      
      const responseData = await response.json();
      console.log('Vibe Check response:', responseData);
      
      if (response.ok) {
        console.log('Vibe Check generation successful:', responseData);
        
        // If we have a vibeCheckId, convert it to a project evaluation
        if (responseData.vibeCheckId) {
          console.log('Converting Vibe Check to project evaluation');
          
          try {
            // Now use the vibeCheckId to convert back to a project evaluation
            const convertResponse = await fetch(`/api/vibe-check/${responseData.vibeCheckId}/convert-to-project-evaluation`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                projectId
              }),
            });
            
            if (convertResponse.ok) {
              toast({
                title: 'Evaluation generated',
                description: 'Your project Vibe Check has been created.',
              });
              
              // Wait a moment to ensure data is available before refetching
              setTimeout(() => {
                refetchOwner();
              }, 500);
            } else {
              throw new Error('Failed to convert Vibe Check to project evaluation');
            }
          } catch (convertError) {
            console.error('Error converting Vibe Check to evaluation:', convertError);
            toast({
              title: 'Error',
              description: 'Failed to save Vibe Check results',
              variant: 'destructive',
            });
          }
        } else {
          throw new Error('No Vibe Check ID returned from API');
        }
      } else {
        console.error('Error generating Vibe Check:', responseData);
        toast({
          title: 'Error',
          description: responseData.error || 'Failed to generate Vibe Check',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating Vibe Check:', error);
      toast({
        title: 'Error',
        description: 'Could not connect to the Vibe Check service',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // For owners or admins without an evaluation yet, show generation button
  if ((isOwner || isAdmin) && !evaluation && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold mb-0">Project Analysis</h2>
        </div>
        
        <Card className="w-full border border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <BarChart3Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>AI-Powered Vibe Check</CardTitle>
                <CardDescription>Get valuable insights into your project's business potential</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUpIcon className="h-5 w-5 text-green-500" />
                  <h3 className="font-medium">Market Analysis</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Understand how your project fits into the current market landscape
                </p>
              </div>
              
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <UsersIcon className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium">Audience Profiling</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Identify your ideal target audience and their characteristics
                </p>
              </div>
              
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldIcon className="h-5 w-5 text-amber-500" />
                  <h3 className="font-medium">Risk Assessment</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Discover potential challenges and mitigation strategies
                </p>
              </div>
            </div>
            
            {isGenerating ? (
              <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-lg border p-6 text-center mt-4">
                <div className="flex flex-col items-center">
                  <div className="relative h-16 w-16 mb-4">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BarChart3Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Generating Your Evaluation</h3>
                  <p className="text-sm text-muted-foreground max-w-md mb-4">
                    Our AI is analyzing your project and creating a comprehensive business evaluation. 
                    This typically takes 30-60 seconds.
                  </p>
                  <Progress className="h-1 w-full max-w-xs mx-auto" value={60} />
                </div>
              </div>
            ) : (
              <Button 
                onClick={() => generateEvaluation(false)}
                className="min-w-[220px] gap-2"
                size="lg"
              >
                <BarChart3Icon className="h-4 w-4" />
                Generate Evaluation
              </Button>
            )}
            
            <p className="text-xs text-center text-muted-foreground italic max-w-md">
              Powered by OpenAI's GPT-4o model for accurate and insightful business analysis
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Hide for non-owners/non-admins if no evaluation exists yet
  if (!isOwner && !isAdmin && !evaluation && !isLoading) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        
        <Card className="w-full overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  <Skeleton className="h-8 w-48" />
                </CardTitle>
                <div className="mt-2">
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-28 rounded-lg" />
                  <Skeleton className="h-28 rounded-lg" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full evaluation view for all users
  if (evaluation) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Project Analysis</h2>
            <p className="text-muted-foreground text-sm">AI-powered comprehensive business evaluation</p>
          </div>
          <div className="flex flex-col items-center bg-gradient-to-br from-primary/10 to-primary/5 p-3 rounded-lg border shadow-sm">
            <span className="text-xs text-muted-foreground mb-1">Viability Score</span>
            <span className="text-3xl font-bold text-primary">{evaluation.fitScore}</span>
            <span className="text-xs text-muted-foreground">out of 100</span>
          </div>
        </div>
        
        <Card className="w-full border-t-4 border-t-primary shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold">
                Comprehensive Evaluation
              </CardTitle>
              {(isOwner || isAdmin) && (
                <div className="flex flex-col items-end gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-primary/20 text-primary hover:bg-primary/5"
                    onClick={() => generateEvaluation(true)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <BarChart3Icon className="h-4 w-4" />
                        <span>Regenerate</span>
                      </>
                    )}
                  </Button>
                  <span className="text-xs text-muted-foreground italic"></span>
                </div>
              )}
            </div>
            <CardDescription>
              {evaluation.fitScoreExplanation}
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="market-fit" value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Menu section with enhanced UI and improved mobile navigation */}
            <div className="sticky top-0 z-30 px-2 sm:px-6 pt-3 pb-2 bg-white dark:bg-gray-950 shadow-md border-b">
              {/* Title */}
              <div className="mb-3 flex justify-center">
                <h3 className="font-medium text-primary flex items-center">
                  <PieChartIcon className="h-4 w-4 mr-1.5" />
                  <span>AI Evaluation Report</span>
                </h3>
              </div>
              
              <div className="pb-1">
                  <TabsList className="flex flex-wrap gap-1.5 sm:gap-2 justify-start w-full bg-transparent h-auto p-0">
                    <TabsTrigger 
                      value="market-fit" 
                      className="px-4 py-2.5 text-sm flex-shrink-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-medium border-2 border-transparent data-[state=active]:border-primary/30 rounded-md"
                    >
                      <BarChart3Icon className="h-4 w-4 mr-1.5" />
                      <span>Market Fit</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="audience" 
                      className="px-4 py-2.5 text-sm flex-shrink-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-medium border-2 border-transparent data-[state=active]:border-primary/30 rounded-md"
                    >
                      <UsersIcon className="h-4 w-4 mr-1.5" />
                      <span>Audience</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="competition" 
                      className="px-4 py-2.5 text-sm flex-shrink-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-medium border-2 border-transparent data-[state=active]:border-primary/30 rounded-md"
                    >
                      <BarChart4Icon className="h-4 w-4 mr-1.5" />
                      <span>Competition</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="business" 
                      className="px-4 py-2.5 text-sm flex-shrink-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-medium border-2 border-transparent data-[state=active]:border-primary/30 rounded-md"
                    >
                      <PieChartIcon className="h-4 w-4 mr-1.5" />
                      <span>Business Plan</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="value" 
                      className="px-4 py-2.5 text-sm flex-shrink-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-medium border-2 border-transparent data-[state=active]:border-primary/30 rounded-md"
                    >
                      <LightbulbIcon className="h-4 w-4 mr-1.5" />
                      <span>Value Prop</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="partnerships" 
                      className="px-4 py-2.5 text-sm flex-shrink-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-medium border-2 border-transparent data-[state=active]:border-primary/30 rounded-md"
                    >
                      <HeartHandshakeIcon className="h-4 w-4 mr-1.5" />
                      <span>Partners</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="risks" 
                      className="px-4 py-2.5 text-sm flex-shrink-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-medium border-2 border-transparent data-[state=active]:border-primary/30 rounded-md"
                    >
                      <ShieldIcon className="h-4 w-4 mr-1.5" />
                      <span>Risks</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="technical" 
                      className="px-4 py-2.5 text-sm flex-shrink-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-medium border-2 border-transparent data-[state=active]:border-primary/30 rounded-md"
                    >
                      <CodeIcon className="h-4 w-4 mr-1.5" />
                      <span>Technical</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="regulatory" 
                      className="px-4 py-2.5 text-sm flex-shrink-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-medium border-2 border-transparent data-[state=active]:border-primary/30 rounded-md"
                    >
                      <ScrollTextIcon className="h-4 w-4 mr-1.5" />
                      <span>Regulatory</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="roadmap" 
                      className="px-4 py-2.5 text-sm flex-shrink-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-medium border-2 border-transparent data-[state=active]:border-primary/30 rounded-md"
                    >
                      <ChevronRightIcon className="h-4 w-4 mr-1.5" />
                      <span>Roadmap</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="launch" 
                      className="px-4 py-2.5 text-sm flex-shrink-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-medium border-2 border-transparent data-[state=active]:border-primary/30 rounded-md"
                    >
                      <RocketIcon className="h-4 w-4 mr-1.5" />
                      <span>Launch</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="customers" 
                      className="px-4 py-2.5 text-sm flex-shrink-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-medium border-2 border-transparent data-[state=active]:border-primary/30 rounded-md"
                    >
                      <UsersIcon className="h-4 w-4 mr-1.5" />
                      <span>Customers</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="revenue" 
                      className="px-4 py-2.5 text-sm flex-shrink-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-medium border-2 border-transparent data-[state=active]:border-primary/30 rounded-md"
                    >
                      <CircleDollarSignIcon className="h-4 w-4 mr-1.5" />
                      <span>Revenue</span>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="bootstrapping" 
                      className="px-4 py-2.5 text-sm flex-shrink-0 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:font-medium border-2 border-transparent data-[state=active]:border-primary/30 rounded-md"
                    >
                      <WrenchIcon className="h-4 w-4 mr-1.5" />
                      <span>Bootstrapping</span>
                    </TabsTrigger>
                  </TabsList>
              </div>
            </div>
            
            {/* Content section with enhanced styling */}
            <div className="px-6 pb-6 pt-4 relative z-10">
              <TabsContent value="market-fit" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-full">
                      <BarChart3Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Market Fit Analysis</h3>
                  </div>
                  <Separator className="mb-4" />
                  
                  {evaluation.marketFitAnalysis?.strengths && (
                    <div className="my-4">
                      <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">Strengths</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {evaluation.marketFitAnalysis.strengths.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluation.marketFitAnalysis?.weaknesses && (
                    <div className="my-4">
                      <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Weaknesses</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {evaluation.marketFitAnalysis.weaknesses.map((weakness: string, index: number) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluation.marketFitAnalysis?.demandPotential && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Demand Potential</h4>
                      <p>{evaluation.marketFitAnalysis.demandPotential}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="audience" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                      <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Target Audience</h3>
                  </div>
                  <Separator className="mb-4" />
                  
                  {evaluation.targetAudience?.demographic && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Demographic Profile</h4>
                      <p>{evaluation.targetAudience.demographic}</p>
                    </div>
                  )}
                  
                  {evaluation.targetAudience?.psychographic && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Psychographic Profile</h4>
                      <p>{evaluation.targetAudience.psychographic}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="business" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                      <PieChartIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Business Plan</h3>
                  </div>
                  <Separator className="mb-4" />
                  
                  {evaluation.businessPlan?.revenueModel && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Revenue Model</h4>
                      <p>{evaluation.businessPlan.revenueModel}</p>
                    </div>
                  )}
                  
                  {evaluation.businessPlan?.goToMarket && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Go-to-Market Strategy</h4>
                      <p>{evaluation.businessPlan.goToMarket}</p>
                    </div>
                  )}
                  
                  {evaluation.businessPlan?.milestones && evaluation.businessPlan.milestones.length > 0 && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Key Milestones</h4>
                      <ol className="list-decimal pl-5 space-y-2">
                        {evaluation.businessPlan.milestones.map((milestone: string, index: number) => (
                          <li key={index}>{milestone}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="value" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                      <LightbulbIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Value Proposition</h3>
                  </div>
                  <Separator className="mb-4" />
                  
                  <div className="my-4 p-4 bg-muted rounded-md border">
                    <p className="italic text-center">{evaluation.valueProposition}</p>
                  </div>
                  
                  <div className="my-4">
                    <h4 className="font-medium mb-2">Fit Score: {evaluation.fitScore}/100</h4>
                    <Progress value={evaluation.fitScore} className="h-2 w-full" />
                    <p className="mt-4">{evaluation.fitScoreExplanation}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="risks" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                      <ShieldIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Risk Assessment</h3>
                  </div>
                  <Separator className="mb-4" />
                  
                  {evaluation.riskAssessment?.risks && evaluation.riskAssessment.risks.length > 0 && (
                    <div className="space-y-4 my-4">
                      {evaluation.riskAssessment.risks.map((risk: any, index: number) => (
                        <div key={index} className="p-3 border rounded-md">
                          <h4 className="font-medium text-amber-600 dark:text-amber-400 mb-1">{risk.type}</h4>
                          <p className="mb-2">{risk.description}</p>
                          <p className="text-sm"><span className="font-medium">Mitigation:</span> {risk.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="technical" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-full">
                      <CodeIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Technical Feasibility</h3>
                  </div>
                  <Separator className="mb-4" />
                  
                  <div className="my-4">
                    <p>{evaluation.technicalFeasibility}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="regulatory" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-full">
                      <ScrollTextIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Regulatory Considerations</h3>
                  </div>
                  <Separator className="mb-4" />
                  
                  <div className="my-4">
                    <p>{evaluation.regulatoryConsiderations}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="roadmap" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                      <ChevronRightIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Implementation Roadmap</h3>
                  </div>
                  <Separator className="mb-4" />
                  
                  {evaluation.implementationRoadmap?.phases && 
                    evaluation.implementationRoadmap.phases.length > 0 && (
                    <div className="space-y-8 my-4">
                      {evaluation.implementationRoadmap.phases.map((phase: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded mb-4 inline-block">
                            <h4 className="font-semibold text-emerald-700 dark:text-emerald-300">{phase.timeframe}</h4>
                          </div>
                          
                          {phase.tasks && phase.tasks.length > 0 && (
                            <div className="mb-4">
                              <h5 className="font-medium mb-2 text-sm uppercase tracking-wide">Key Tasks</h5>
                              <ul className="list-disc pl-5 space-y-1">
                                {phase.tasks.map((task: string, taskIndex: number) => (
                                  <li key={taskIndex}>{task}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {phase.metrics && phase.metrics.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-2 text-sm uppercase tracking-wide">Success Metrics</h5>
                              <div className="flex flex-wrap gap-2">
                                {phase.metrics.map((metric: string, metricIndex: number) => (
                                  <span key={metricIndex} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 py-1 px-3 rounded-full text-sm">
                                    {metric}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="partnerships" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-full">
                      <HeartHandshakeIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Partnership Opportunities</h3>
                  </div>
                  <Separator className="mb-4" />
                  
                  {evaluation.partnershipOpportunities?.partners && 
                    evaluation.partnershipOpportunities.partners.length > 0 && (
                    <div className="my-4">
                      <ul className="list-disc pl-5 space-y-2">
                        {evaluation.partnershipOpportunities.partners.map((partner: string, index: number) => (
                          <li key={index}>{partner}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="competition" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-full">
                      <BarChart4Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Competitive Landscape</h3>
                  </div>
                  <Separator className="mb-4" />
                  
                  {evaluation.competitiveLandscape?.competitors && 
                    evaluation.competitiveLandscape.competitors.length > 0 && (
                    <div className="space-y-4 my-4">
                      {evaluation.competitiveLandscape.competitors.map((competitor: any, index: number) => (
                        <div key={index} className="p-3 border rounded-md">
                          <h4 className="font-medium mb-1">{competitor.name}</h4>
                          <p className="text-sm">
                            <span className="font-medium">Differentiation:</span> {competitor.differentiation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Launch Strategy Tab */}
              <TabsContent value="launch" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                      <RocketIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Launch Strategy</h3>
                  </div>
                  <Separator className="mb-4" />
                  
                  {evaluation.launchStrategy?.mvpFeatures && evaluation.launchStrategy.mvpFeatures.length > 0 && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">MVP Features</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {evaluation.launchStrategy.mvpFeatures.map((feature: string, index: number) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluation.launchStrategy?.timeToMarket && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Time to Market</h4>
                      <p>{evaluation.launchStrategy.timeToMarket}</p>
                    </div>
                  )}
                  
                  {evaluation.launchStrategy?.marketEntryApproach && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Market Entry Approach</h4>
                      <p>{evaluation.launchStrategy.marketEntryApproach}</p>
                    </div>
                  )}
                  
                  {evaluation.launchStrategy?.criticalResources && evaluation.launchStrategy.criticalResources.length > 0 && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Critical Resources</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {evaluation.launchStrategy.criticalResources.map((resource: string, index: number) => (
                          <li key={index}>{resource}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluation.launchStrategy?.launchChecklist && evaluation.launchStrategy.launchChecklist.length > 0 && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Launch Checklist</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {evaluation.launchStrategy.launchChecklist.map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Customer Acquisition Tab */}
              <TabsContent value="customers" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-full">
                      <UsersIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Customer Acquisition</h3>
                  </div>
                  <Separator className="mb-4" />
                  
                  {evaluation.customerAcquisition?.primaryChannels && evaluation.customerAcquisition.primaryChannels.length > 0 && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Primary Channels</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {evaluation.customerAcquisition.primaryChannels.map((channel: string, index: number) => (
                          <li key={index}>{channel}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluation.customerAcquisition?.acquisitionCost && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Acquisition Cost</h4>
                      <p>{evaluation.customerAcquisition.acquisitionCost}</p>
                    </div>
                  )}
                  
                  {evaluation.customerAcquisition?.conversionStrategy && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Conversion Strategy</h4>
                      <p>{evaluation.customerAcquisition.conversionStrategy}</p>
                    </div>
                  )}
                  
                  {evaluation.customerAcquisition?.retentionTactics && evaluation.customerAcquisition.retentionTactics.length > 0 && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Retention Tactics</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {evaluation.customerAcquisition.retentionTactics.map((tactic: string, index: number) => (
                          <li key={index}>{tactic}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluation.customerAcquisition?.growthOpportunities && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Growth Opportunities</h4>
                      <p>{evaluation.customerAcquisition.growthOpportunities}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Revenue Generation Tab */}
              <TabsContent value="revenue" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-full">
                      <CircleDollarSignIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Revenue Generation</h3>
                  </div>
                  <Separator className="mb-4" />
                  
                  {evaluation.revenueGeneration?.businessModels && evaluation.revenueGeneration.businessModels.length > 0 && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Business Models</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {evaluation.revenueGeneration.businessModels.map((model: string, index: number) => (
                          <li key={index}>{model}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluation.revenueGeneration?.pricingStrategy && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Pricing Strategy</h4>
                      <p>{evaluation.revenueGeneration.pricingStrategy}</p>
                    </div>
                  )}
                  
                  {evaluation.revenueGeneration?.revenueStreams && evaluation.revenueGeneration.revenueStreams.length > 0 && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Revenue Streams</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {evaluation.revenueGeneration.revenueStreams.map((stream: string, index: number) => (
                          <li key={index}>{stream}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluation.revenueGeneration?.unitEconomics && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Unit Economics</h4>
                      <p>{evaluation.revenueGeneration.unitEconomics}</p>
                    </div>
                  )}
                  
                  {evaluation.revenueGeneration?.scalingPotential && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Scaling Potential</h4>
                      <p>{evaluation.revenueGeneration.scalingPotential}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Bootstrapping Guide Tab */}
              <TabsContent value="bootstrapping" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                      <WrenchIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-semibold text-lg">Bootstrapping Guide</h3>
                  </div>
                  <Separator className="mb-4" />
                  
                  {evaluation.bootstrappingGuide?.costMinimizationTips && evaluation.bootstrappingGuide.costMinimizationTips.length > 0 && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Cost Minimization Tips</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {evaluation.bootstrappingGuide.costMinimizationTips.map((tip: string, index: number) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluation.bootstrappingGuide?.diySolutions && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">DIY Solutions</h4>
                      <p>{evaluation.bootstrappingGuide.diySolutions}</p>
                    </div>
                  )}
                  
                  {evaluation.bootstrappingGuide?.growthWithoutFunding && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Growth Without Funding</h4>
                      <p>{evaluation.bootstrappingGuide.growthWithoutFunding}</p>
                    </div>
                  )}
                  
                  {evaluation.bootstrappingGuide?.timeManagement && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Time Management</h4>
                      <p>{evaluation.bootstrappingGuide.timeManagement}</p>
                    </div>
                  )}
                  
                  {evaluation.bootstrappingGuide?.milestonesOnBudget && evaluation.bootstrappingGuide.milestonesOnBudget.length > 0 && (
                    <div className="my-4">
                      <h4 className="font-medium mb-2">Milestones on a Budget</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {evaluation.bootstrappingGuide.milestonesOnBudget.map((milestone: string, index: number) => (
                          <li key={index}>{milestone}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
          
          {isAdmin && (
            <div className="px-6 pb-6 pt-2 flex justify-between items-center border-t mt-6">
              <p className="text-sm text-muted-foreground italic">
                <InfoIcon className="h-3 w-3 inline mr-1" />
                Evaluations are always freshly generated
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2" 
                onClick={() => generateEvaluation(true)}
                disabled={isGenerating}
              >
                <BarChart3Icon className="h-4 w-4" />
                {isGenerating ? 'Regenerating...' : 'Regenerate Evaluation'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return null;
}
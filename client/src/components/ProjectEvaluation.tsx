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
  BarChart4Icon
} from 'lucide-react';

interface ProjectEvaluationProps {
  projectId: number;
  isOwner: boolean;
}

export default function ProjectEvaluation({ projectId, isOwner }: ProjectEvaluationProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('market-fit');
  const [isGenerating, setIsGenerating] = useState(false);

  // Query to get public evaluation data (minimal version for non-owners)
  const { 
    data: publicData, 
    isLoading: isPublicLoading,
    refetch: refetchPublic
  } = useQuery({
    queryKey: [`/api/ai/public-evaluation/${projectId}`],
    retry: false,
  });

  // Query only for owners to get full evaluation data
  const { 
    data: ownerData, 
    isLoading: isOwnerLoading,
    refetch: refetchOwner
  } = useQuery({
    queryKey: [`/api/ai/project-evaluation/${projectId}`],
    retry: false,
    enabled: isOwner, // Only run this query if user is the owner
  });

  // Choose which data set to use based on user role
  const isOwnerView = isOwner && ownerData;
  const evaluation = isOwnerView ? ownerData?.evaluation : publicData?.evaluation;
  const isError = isOwnerView ? ownerData?.error : publicData?.error;
  const isLoading = isOwnerView ? isOwnerLoading : isPublicLoading;

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

  // Generate evaluation when requested by owner
  const generateEvaluation = async (regenerate = false) => {
    if (!isOwner) return;
    
    setIsGenerating(true);
    console.log(`${regenerate ? 'Regenerating' : 'Generating'} evaluation for project:`, projectId);
    
    try {
      console.log('Starting evaluation generation for project:', projectId);
      const response = await fetch('/api/ai/evaluate-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          projectId,
          regenerate
        }),
      });
      
      const responseText = await response.text();
      console.log('Raw API response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        toast({
          title: 'Error',
          description: 'The server returned an invalid response',
          variant: 'destructive',
        });
        setIsGenerating(false);
        return;
      }
      
      if (response.ok) {
        console.log('Evaluation generation successful:', result);
        toast({
          title: 'Evaluation generated',
          description: 'Your project evaluation has been created.',
        });
        
        // Wait a moment to ensure data is available before refetching
        setTimeout(() => {
          refetchPublic();
          if (isOwner) {
            refetchOwner();
          }
        }, 500);
      } else {
        console.error('Error generating evaluation:', result);
        toast({
          title: 'Error',
          description: result.error || 'Failed to generate evaluation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating evaluation:', error);
      toast({
        title: 'Error',
        description: 'Could not connect to the evaluation service',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // For owners without an evaluation yet, show generation button
  if (isOwner && !evaluation && !isLoading) {
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
                <CardTitle>AI-Powered Evaluation</CardTitle>
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

  // Hide for non-owners if no evaluation exists yet
  if (!isOwner && !evaluation && !isLoading) {
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
                <CardDescription className="mt-2">
                  <span className="inline-block">
                    <Skeleton className="h-4 w-64" />
                  </span>
                </CardDescription>
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

  // For non-owners with data, show limited view
  if (!isOwner && evaluation) {
    return (
      <div className="space-y-4">
        <Card className="w-full border-t-4 border-t-primary shadow-md">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold">Project Viability Score</CardTitle>
                <CardDescription className="text-sm mt-1">AI-powered market analysis</CardDescription>
              </div>
              <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                <span className="text-3xl font-bold text-primary">{evaluation.fitScore}</span>
                <span className="text-xs text-muted-foreground">out of 100</span>
              </div>
            </div>
            <Progress value={evaluation.fitScore} className="h-2 w-full mt-3" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            {evaluation.valueProposition && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                <div className="flex gap-2 items-center mb-2">
                  <LightbulbIcon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Value Proposition</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{evaluation.valueProposition}</p>
              </div>
            )}
            
            {evaluation.marketFitAnalysis?.strengths && evaluation.marketFitAnalysis.strengths.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2 mb-3 text-green-700 dark:text-green-400">
                  <BarChart3Icon className="h-4 w-4" />
                  Key Strengths
                </h4>
                <ul className="list-disc pl-5 space-y-2">
                  {evaluation.marketFitAnalysis.strengths.map((strength: string, index: number) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300">{strength}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="text-center text-sm text-muted-foreground mt-4 italic">
              Login as project owner to view the complete analysis
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full evaluation view for owners
  if (isOwner && evaluation) {
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
            </div>
            <CardDescription>
              {evaluation.fitScoreExplanation}
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="market-fit" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-1 pb-4">
              <TabsList className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                <TabsTrigger value="market-fit" className="px-2 py-1.5 text-xs">
                  <BarChart3Icon className="h-4 w-4 mr-1" />
                  <span>Market Fit</span>
                </TabsTrigger>
                <TabsTrigger value="audience" className="px-2 py-1.5 text-xs">
                  <UsersIcon className="h-4 w-4 mr-1" />
                  <span>Audience</span>
                </TabsTrigger>
                <TabsTrigger value="business" className="px-2 py-1.5 text-xs">
                  <TrendingUpIcon className="h-4 w-4 mr-1" />
                  <span>Business</span>
                </TabsTrigger>
                <TabsTrigger value="value" className="px-2 py-1.5 text-xs">
                  <LightbulbIcon className="h-4 w-4 mr-1" />
                  <span>Value</span>
                </TabsTrigger>
                <TabsTrigger value="risks" className="px-2 py-1.5 text-xs">
                  <ShieldIcon className="h-4 w-4 mr-1" />
                  <span>Risks</span>
                </TabsTrigger>
                <TabsTrigger value="technical" className="px-2 py-1.5 text-xs">
                  <CodeIcon className="h-4 w-4 mr-1" />
                  <span>Technical</span>
                </TabsTrigger>
                <TabsTrigger value="regulatory" className="px-2 py-1.5 text-xs">
                  <ScrollTextIcon className="h-4 w-4 mr-1" />
                  <span>Regulatory</span>
                </TabsTrigger>
                <TabsTrigger value="partnerships" className="px-2 py-1.5 text-xs">
                  <HeartHandshakeIcon className="h-4 w-4 mr-1" />
                  <span>Partners</span>
                </TabsTrigger>
                <TabsTrigger value="competition" className="px-2 py-1.5 text-xs">
                  <BarChart4Icon className="h-4 w-4 mr-1" />
                  <span>Competitors</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="px-6 pb-6">
              <TabsContent value="market-fit" className="mt-0 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Market Fit Analysis</h3>
                  <Separator className="my-2" />
                  
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
              
              <TabsContent value="audience" className="mt-0 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Target Audience</h3>
                  <Separator className="my-2" />
                  
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
              
              <TabsContent value="business" className="mt-0 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Business Plan</h3>
                  <Separator className="my-2" />
                  
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
              
              <TabsContent value="value" className="mt-0 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Value Proposition</h3>
                  <Separator className="my-2" />
                  
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
              
              <TabsContent value="risks" className="mt-0 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Risk Assessment</h3>
                  <Separator className="my-2" />
                  
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
              
              <TabsContent value="technical" className="mt-0 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Technical Feasibility</h3>
                  <Separator className="my-2" />
                  
                  <div className="my-4">
                    <p>{evaluation.technicalFeasibility}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="regulatory" className="mt-0 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Regulatory Considerations</h3>
                  <Separator className="my-2" />
                  
                  <div className="my-4">
                    <p>{evaluation.regulatoryConsiderations}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="partnerships" className="mt-0 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Partnership Opportunities</h3>
                  <Separator className="my-2" />
                  
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
              
              <TabsContent value="competition" className="mt-0 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Competitive Landscape</h3>
                  <Separator className="my-2" />
                  
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
            </div>
          </Tabs>
          
          {isOwner && (ownerData?.isAdmin === true) && (
            <div className="px-6 pb-6 pt-2 flex justify-end border-t mt-6">
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
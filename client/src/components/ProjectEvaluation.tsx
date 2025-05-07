import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    enabled: isOwner,
    retry: false,
  });

  // Whether we're in owner view with full data
  const isOwnerView = isOwner && ownerData?.evaluation;
  
  // Choose the correct data source
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
  const generateEvaluation = async () => {
    if (!isOwner) return;
    
    setIsGenerating(true);
    console.log('Generating evaluation for project:', projectId);
    
    try {
      console.log('Starting evaluation generation for project:', projectId);
      const response = await fetch('/api/ai/evaluate-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
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
      console.error('Error during evaluation generation:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to the server. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // If we have an error and are the owner, show generate button
  if (isOwner && !evaluation && !isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Project Evaluation</CardTitle>
          <CardDescription>
            Generate an AI-powered business and market analysis for your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>No evaluation has been generated for this project yet. Would you like to create one?</p>
            <p className="text-sm text-muted-foreground">
              The evaluation will include market fit analysis, target audience information, 
              business plan recommendations, and more.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={generateEvaluation} 
            disabled={isGenerating}
            className="w-full md:w-auto"
          >
            {isGenerating ? 'Generating...' : 'Generate Evaluation'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If not owner and no evaluation exists, show nothing or minimal message
  if (!isOwner && !evaluation && !isLoading) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-2/3" /></CardTitle>
          <CardDescription>
            <span><Skeleton className="h-4 w-full" /></span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div><Skeleton className="h-4 w-full" /></div>
            <div><Skeleton className="h-4 w-full" /></div>
            <div><Skeleton className="h-4 w-full" /></div>
            <div><Skeleton className="h-4 w-5/6" /></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For non-owners with data, show limited view
  if (!isOwner && evaluation) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Project Viability Score</span>
            <span className="text-xl font-bold">{evaluation.fitScore}/100</span>
          </CardTitle>
          <CardDescription>AI-powered analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={evaluation.fitScore} className="h-2 w-full" />
            
            {evaluation.valueProposition && (
              <Alert>
                <LightbulbIcon className="h-4 w-4" />
                <AlertTitle>Value Proposition</AlertTitle>
                <AlertDescription>
                  {evaluation.valueProposition}
                </AlertDescription>
              </Alert>
            )}
            
            {evaluation.marketFitAnalysis?.strengths && evaluation.marketFitAnalysis.strengths.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Key Strengths</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {evaluation.marketFitAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="text-sm">{strength}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full evaluation view for owners
  if (isOwner && evaluation) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Project Evaluation</span>
            <span className="text-xl font-bold">{evaluation.fitScore}/100</span>
          </CardTitle>
          <CardDescription>
            AI-powered business and market analysis
          </CardDescription>
          <Progress value={evaluation.fitScore} className="h-2 w-full mt-2" />
        </CardHeader>
        
        <Tabs defaultValue="market-fit" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-9 mb-4 mx-6 mt-2">
            <TabsTrigger value="market-fit" className="text-xs">
              <BarChart3Icon className="h-4 w-4 mr-1 hidden sm:inline-block" />
              <span className="hidden sm:inline-block">Market Fit</span>
              <span className="sm:hidden">Market</span>
            </TabsTrigger>
            <TabsTrigger value="audience" className="text-xs">
              <UsersIcon className="h-4 w-4 mr-1 hidden sm:inline-block" />
              <span>Audience</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="text-xs">
              <TrendingUpIcon className="h-4 w-4 mr-1 hidden sm:inline-block" />
              <span>Business</span>
            </TabsTrigger>
            <TabsTrigger value="value" className="text-xs">
              <LightbulbIcon className="h-4 w-4 mr-1 hidden sm:inline-block" />
              <span>Value</span>
            </TabsTrigger>
            <TabsTrigger value="risks" className="text-xs">
              <ShieldIcon className="h-4 w-4 mr-1 hidden sm:inline-block" />
              <span>Risks</span>
            </TabsTrigger>
            <TabsTrigger value="technical" className="text-xs">
              <CodeIcon className="h-4 w-4 mr-1 hidden sm:inline-block" />
              <span>Technical</span>
            </TabsTrigger>
            <TabsTrigger value="regulatory" className="text-xs">
              <ScrollTextIcon className="h-4 w-4 mr-1 hidden sm:inline-block" />
              <span>Regulatory</span>
            </TabsTrigger>
            <TabsTrigger value="partnerships" className="text-xs">
              <HeartHandshakeIcon className="h-4 w-4 mr-1 hidden sm:inline-block" />
              <span>Partners</span>
            </TabsTrigger>
            <TabsTrigger value="competition" className="text-xs">
              <BarChart4Icon className="h-4 w-4 mr-1 hidden sm:inline-block" />
              <span>Competition</span>
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[300px] md:h-[400px] px-6 pb-4">
            <TabsContent value="market-fit" className="mt-0 space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Market Fit Analysis</h3>
                <Separator className="my-2" />
                
                {evaluation.marketFitAnalysis?.strengths && (
                  <div className="my-4">
                    <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">Strengths</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      {evaluation.marketFitAnalysis.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {evaluation.marketFitAnalysis?.weaknesses && (
                  <div className="my-4">
                    <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Weaknesses</h4>
                    <ul className="list-disc pl-5 space-y-2">
                      {evaluation.marketFitAnalysis.weaknesses.map((weakness, index) => (
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
                      {evaluation.businessPlan.milestones.map((milestone, index) => (
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
                    {evaluation.riskAssessment.risks.map((risk, index) => (
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
                      {evaluation.partnershipOpportunities.partners.map((partner, index) => (
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
                    {evaluation.competitiveLandscape.competitors.map((competitor, index) => (
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
          </ScrollArea>
        </Tabs>
      </Card>
    );
  }

  return null;
}
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3, 
  CheckCircle2, 
  Target, 
  Briefcase, 
  AlertTriangle, 
  Rocket, 
  Users, 
  DollarSign, 
  HandHelping, 
  Brain, 
  FileDown, 
  Loader2, 
  Code,
  Locate
} from 'lucide-react';

interface ProjectEvaluationProps {
  projectId: number;
  isOwner: boolean;
  isAdminUser?: boolean;
}

export default function ProjectEvaluation({ projectId, isOwner, isAdminUser = false }: ProjectEvaluationProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('market-fit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [isShowingResults, setIsShowingResults] = useState(false);

  // Check if user is admin based on prop or user role
  const isAdmin = isAdminUser || user?.role === 'admin';

  // We need evaluation data for owners and potentially admins
  const { 
    data: ownerData, 
    isLoading
  } = useQuery<any>({
    queryKey: [`/api/ai/project-evaluation/${projectId}`],
    retry: false,
    enabled: true, // Always fetch to check for admin rights and evaluation data
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: 'always' // Always refetch when window gains focus
  });
  
  // Set the evaluation result from the query if it exists
  useEffect(() => {
    if (ownerData?.evaluation) {
      setEvaluationResult(ownerData.evaluation);
      setIsShowingResults(true);
    }
  }, [ownerData]);

  // Generate Vibe Check for this project
  const generateEvaluation = async () => {
    if (!isOwner && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only project owners can generate evaluations",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    setProgress(0);
    setEvaluationResult(null);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Simulate progress updates with an interval
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 5;
        return newProgress > 95 ? 95 : newProgress;
      });
    }, 1000);

    try {
      // For authenticated users, we use a special token that bypasses reCAPTCHA
      const recaptchaToken = "authenticated-user-token";
      
      // Get the project data first
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error("Failed to fetch project data");
      }
      
      const projectData = await projectResponse.json();
      
      // Send data to generate vibe check
      const response = await fetch("/api/vibe-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectDescription: projectData.project.description,
          recaptchaToken,
          projectId: projectId // Associate this vibe check with the project
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate evaluation");
      }

      const result = await response.json();
      
      setEvaluationResult(result.evaluation);
      setIsShowingResults(true);

      // Ensure we're at the top of the page when showing results
      window.scrollTo({ top: 0, behavior: "smooth" });

      toast({
        title: "Vibe Check Complete!",
        description: "Your project evaluation has been generated successfully",
      });
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error generating vibe check:", error);
      setProgress(0);
      toast({
        title: "Evaluation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate evaluation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Render evaluation progress
  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-t-4 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h3 className="text-2xl font-medium mb-3">AI Vibe Check in Progress</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Our AI is analyzing your project idea and generating a comprehensive
          business evaluation. This typically takes 30-60 seconds.
        </p>
        <Progress className="h-2 w-full max-w-md mx-auto mb-3" value={progress} />
        <p className="text-sm text-muted-foreground">
          {progress < 100 ? "Analyzing..." : "Analysis complete!"}
        </p>
      </div>
    );
  }

  // Render empty state with generation button for owners
  if (!evaluationResult || !isShowingResults) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="bg-muted/50 rounded-full p-3 mb-4">
          <BarChart3 className="h-8 w-8 text-primary/80" />
        </div>
        <h3 className="text-lg font-medium mb-2">Project Evaluation</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-md">
          Generate an AI-powered business analysis and market fit assessment for this project.
        </p>
        {isOwner || isAdmin ? (
          <Button onClick={generateEvaluation} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
                Generating...
              </>
            ) : (
              "Generate Project Evaluation"
            )}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Only the project owner can generate evaluations.
          </p>
        )}
      </div>
    );
  }

  // Render evaluation results
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Project Evaluation</h2>
          <p className="text-muted-foreground text-sm">
            AI-powered comprehensive business evaluation
          </p>
        </div>
        {(isOwner || isAdmin) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateEvaluation}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"></span>
                Updating...
              </>
            ) : (
              "Refresh Evaluation"
            )}
          </Button>
        )}
      </div>

      {/* Vibe Score and Explanation Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            {/* Vibe Score */}
            <div className="flex flex-col items-center justify-center sm:border-r sm:border-primary/20 sm:pr-6 mb-4 sm:mb-0">
              <span className="text-sm text-muted-foreground mb-1">
                Vibe Score
              </span>
              <span className="text-4xl font-bold text-primary">
                {evaluationResult.fitScore}
              </span>
              <span className="text-xs text-muted-foreground">
                out of 100
              </span>
            </div>

            {/* Fit Score Explanation */}
            <div className="flex-1">
              <h3 className="font-medium text-sm mb-2">
                Vibe Score Explanation
              </h3>
              <p className="text-sm text-muted-foreground">
                {evaluationResult.fitScoreExplanation
                  ? evaluationResult.fitScoreExplanation
                  : "This score represents how well the idea fits the market and its potential for success."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="market-fit" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-2 h-auto mb-4">
          {/* Group 1: Understanding the idea */}
          <TabsTrigger value="market-fit" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" /> Market Fit
          </TabsTrigger>
          <TabsTrigger value="target-audience" className="flex items-center gap-1">
            <Target className="h-4 w-4" /> Target Audience
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center gap-1">
            <Code className="h-4 w-4" /> Technical
          </TabsTrigger>
          <TabsTrigger value="business-plan" className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" /> Business
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" /> Revenue
          </TabsTrigger>
          
          {/* Group 2: Building the business */}
          <TabsTrigger value="risks" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> Risks
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-1">
            <Users className="h-4 w-4" /> Customers
          </TabsTrigger>
          <TabsTrigger value="launch-strategy" className="flex items-center gap-1">
            <Rocket className="h-4 w-4" /> Launch
          </TabsTrigger>
          <TabsTrigger value="bootstrapping" className="flex items-center gap-1">
            <HandHelping className="h-4 w-4" /> Bootstrapping
          </TabsTrigger>
          <TabsTrigger value="competition" className="flex items-center gap-1">
            <Locate className="h-4 w-4" /> Competition
          </TabsTrigger>
        </TabsList>

        {/* Market Fit Analysis Tab */}
        <TabsContent value="market-fit" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-6">Market Fit Analysis</h3>
              
              {evaluationResult.marketFitAnalysis?.strengths && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-3 text-green-600">Strengths</h4>
                  <ul className="space-y-2">
                    {evaluationResult.marketFitAnalysis.strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {evaluationResult.marketFitAnalysis?.weaknesses && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-3 text-red-600">Areas for Improvement</h4>
                  <ul className="space-y-2">
                    {evaluationResult.marketFitAnalysis.weaknesses.map((weakness: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluationResult.valueProposition && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-lg font-medium mb-3">Value Proposition</h4>
                  <div className="bg-muted p-4 rounded-lg border border-border italic text-lg leading-relaxed">
                    "{evaluationResult.valueProposition}"
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Target Audience Tab */}
        <TabsContent value="target-audience" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-6">Target Audience</h3>
              
              {evaluationResult.targetAudience?.demographic && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-3">Demographics</h4>
                  <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.targetAudience.demographic}</p>
                </div>
              )}
              
              {evaluationResult.targetAudience?.psychographic && (
                <div>
                  <h4 className="text-lg font-medium mb-3">Psychographics</h4>
                  <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.targetAudience.psychographic}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-6">Technical Feasibility</h3>
              
              {evaluationResult.technicalFeasibility ? (
                <div className="bg-muted/50 p-4 rounded-md">
                  <p>{evaluationResult.technicalFeasibility}</p>
                </div>
              ) : (
                <p>No technical feasibility analysis available for this evaluation.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Business Plan Tab */}
        <TabsContent value="business-plan" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-6">Business Plan</h3>
              
              {evaluationResult.businessPlan?.revenueModel && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-3">Revenue Model</h4>
                  <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.businessPlan.revenueModel}</p>
                </div>
              )}
              
              {evaluationResult.businessPlan?.goToMarket && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-3">Go-to-Market Strategy</h4>
                  <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.businessPlan.goToMarket}</p>
                </div>
              )}
              
              {evaluationResult.businessPlan?.milestones && evaluationResult.businessPlan.milestones.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium mb-3">Key Milestones</h4>
                  <ul className="space-y-2">
                    {evaluationResult.businessPlan.milestones.map((milestone: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>{milestone}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Revenue Generation Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-6">Revenue Generation</h3>
              
              {evaluationResult.revenueGeneration ? (
                <div className="space-y-6">
                  {evaluationResult.revenueGeneration.businessModels && evaluationResult.revenueGeneration.businessModels.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Business Models</h4>
                      <ul className="space-y-2">
                        {evaluationResult.revenueGeneration.businessModels.map((model: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span>{model}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluationResult.revenueGeneration.pricingStrategy && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Pricing Strategy</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.revenueGeneration.pricingStrategy}</p>
                    </div>
                  )}
                  
                  {evaluationResult.revenueGeneration.revenueStreams && evaluationResult.revenueGeneration.revenueStreams.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Revenue Streams</h4>
                      <ul className="space-y-2">
                        {evaluationResult.revenueGeneration.revenueStreams.map((stream: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <DollarSign className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span>{stream}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluationResult.revenueGeneration.unitEconomics && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Unit Economics</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.revenueGeneration.unitEconomics}</p>
                    </div>
                  )}
                  
                  {evaluationResult.revenueGeneration.scalingPotential && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Scaling Potential</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.revenueGeneration.scalingPotential}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p>No revenue generation data available for this evaluation.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-6">Risk Assessment</h3>
              
              {evaluationResult.riskAssessment?.risks && evaluationResult.riskAssessment.risks.length > 0 ? (
                <div className="space-y-6">
                  {evaluationResult.riskAssessment.risks.map((risk: any, index: number) => (
                    <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50/30 dark:bg-red-950/10">
                      <h4 className="text-lg font-medium mb-2 text-red-700 dark:text-red-400">{risk.type}</h4>
                      <p className="mb-4">{risk.description}</p>
                      
                      {risk.mitigation && (
                        <div className="bg-green-50/30 dark:bg-green-950/10 border border-green-200 dark:border-green-900 p-3 rounded-md">
                          <h5 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Mitigation Strategy:</h5>
                          <p>{risk.mitigation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No risk assessment data available for this evaluation.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Customer Acquisition Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-6">Customer Acquisition</h3>
              
              {evaluationResult.customerAcquisition ? (
                <div className="space-y-6">
                  {evaluationResult.customerAcquisition.primaryChannels && evaluationResult.customerAcquisition.primaryChannels.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Primary Channels</h4>
                      <ul className="space-y-2">
                        {evaluationResult.customerAcquisition.primaryChannels.map((channel: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span>{channel}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluationResult.customerAcquisition.acquisitionCost && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Acquisition Cost</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.customerAcquisition.acquisitionCost}</p>
                    </div>
                  )}
                  
                  {evaluationResult.customerAcquisition.conversionStrategy && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Conversion Strategy</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.customerAcquisition.conversionStrategy}</p>
                    </div>
                  )}
                  
                  {evaluationResult.customerAcquisition.retentionTactics && evaluationResult.customerAcquisition.retentionTactics.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Retention Tactics</h4>
                      <ul className="space-y-2">
                        {evaluationResult.customerAcquisition.retentionTactics.map((tactic: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span>{tactic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluationResult.customerAcquisition.growthOpportunities && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Growth Opportunities</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.customerAcquisition.growthOpportunities}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p>No customer acquisition data available for this evaluation.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Launch Strategy Tab */}
        <TabsContent value="launch-strategy" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-6">Launch Strategy</h3>
              
              {evaluationResult.launchStrategy ? (
                <div className="space-y-6">
                  {evaluationResult.launchStrategy.mvpFeatures && evaluationResult.launchStrategy.mvpFeatures.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">MVP Features</h4>
                      <ul className="space-y-2">
                        {evaluationResult.launchStrategy.mvpFeatures.map((feature: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluationResult.launchStrategy.timeToMarket && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Time to Market</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.launchStrategy.timeToMarket}</p>
                    </div>
                  )}
                  
                  {evaluationResult.launchStrategy.marketEntryApproach && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Market Entry Approach</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.launchStrategy.marketEntryApproach}</p>
                    </div>
                  )}
                  
                  {evaluationResult.launchStrategy.criticalResources && evaluationResult.launchStrategy.criticalResources.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Critical Resources</h4>
                      <ul className="space-y-2">
                        {evaluationResult.launchStrategy.criticalResources.map((resource: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <span>{resource}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluationResult.launchStrategy.launchChecklist && evaluationResult.launchStrategy.launchChecklist.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Launch Checklist</h4>
                      <ul className="space-y-2">
                        {evaluationResult.launchStrategy.launchChecklist.map((item: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p>No launch strategy data available for this evaluation.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Bootstrapping Guide Tab */}
        <TabsContent value="bootstrapping" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-6">Bootstrapping Guide</h3>
              
              {evaluationResult.bootstrappingGuide ? (
                <div className="space-y-6">
                  {evaluationResult.bootstrappingGuide.costMinimizationTips && evaluationResult.bootstrappingGuide.costMinimizationTips.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Cost Minimization Tips</h4>
                      <ul className="space-y-2">
                        {evaluationResult.bootstrappingGuide.costMinimizationTips.map((tip: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluationResult.bootstrappingGuide.diySolutions && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">DIY Solutions</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.bootstrappingGuide.diySolutions}</p>
                    </div>
                  )}
                  
                  {evaluationResult.bootstrappingGuide.growthWithoutFunding && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Growth Without Funding</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.bootstrappingGuide.growthWithoutFunding}</p>
                    </div>
                  )}
                  
                  {evaluationResult.bootstrappingGuide.timeManagement && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Time Management</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.bootstrappingGuide.timeManagement}</p>
                    </div>
                  )}
                  
                  {evaluationResult.bootstrappingGuide.milestonesOnBudget && evaluationResult.bootstrappingGuide.milestonesOnBudget.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Milestones on Budget</h4>
                      <ul className="space-y-2">
                        {evaluationResult.bootstrappingGuide.milestonesOnBudget.map((milestone: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <span>{milestone}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p>No bootstrapping guide data available for this evaluation.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Competition Tab */}
        <TabsContent value="competition" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-6">Competitive Landscape</h3>
              
              {evaluationResult.competitiveLandscape?.marketPositioning && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-3">Market Position</h4>
                  <p className="bg-muted/50 p-4 rounded-md">
                    {evaluationResult.competitiveLandscape.marketPositioning}
                  </p>
                </div>
              )}
              
              {evaluationResult.competitiveLandscape?.competitors && evaluationResult.competitiveLandscape.competitors.length > 0 ? (
                <div>
                  <h4 className="text-lg font-medium mb-3">Key Competitors</h4>
                  <div className="space-y-4">
                    {evaluationResult.competitiveLandscape.competitors.map((competitor: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h5 className="text-md font-semibold mb-2">{competitor.name}</h5>
                        <p className="text-sm text-muted-foreground mb-3">{competitor.differentiation}</p>
                        
                        {competitor.strengths && competitor.strengths.length > 0 && (
                          <div className="mt-2">
                            <h6 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Strengths:</h6>
                            <ul className="text-sm">
                              {competitor.strengths.map((s: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1 mb-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-1" />
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                          <div className="mt-2">
                            <h6 className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Weaknesses:</h6>
                            <ul className="text-sm">
                              {competitor.weaknesses.map((w: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1 mb-1">
                                  <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-1" />
                                  <span>{w}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p>No competitor analysis available for this evaluation.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Adjacent Ideas Tab */}
        <TabsContent value="adjacent-ideas" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-6">Adjacent Ideas & Opportunities</h3>
              
              {evaluationResult.adjacentIdeas ? (
                <div className="space-y-6">
                  {evaluationResult.adjacentIdeas.complementaryProducts && evaluationResult.adjacentIdeas.complementaryProducts.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Complementary Products</h4>
                      <ul className="space-y-2">
                        {evaluationResult.adjacentIdeas.complementaryProducts.map((product: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <span>{product}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluationResult.adjacentIdeas.pivotPossibilities && evaluationResult.adjacentIdeas.pivotPossibilities.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Pivot Possibilities</h4>
                      <ul className="space-y-2">
                        {evaluationResult.adjacentIdeas.pivotPossibilities.map((pivot: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                            <span>{pivot}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluationResult.adjacentIdeas.expansionOpportunities && evaluationResult.adjacentIdeas.expansionOpportunities.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Expansion Opportunities</h4>
                      <ul className="space-y-2">
                        {evaluationResult.adjacentIdeas.expansionOpportunities.map((opportunity: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span>{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluationResult.adjacentIdeas.strategicRecommendations && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Strategic Recommendations</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.adjacentIdeas.strategicRecommendations}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p>No adjacent ideas data available for this evaluation.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
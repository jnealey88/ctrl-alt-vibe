import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Clock,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function SharedVibeCheck() {
  const [, setLocation] = useLocation();
  const [shareId, setShareId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("market-fit");
  const [projectDetails, setProjectDetails] = useState<{
    projectDescription: string;
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    // Extract the shareId from the URL
    const path = window.location.pathname;
    const matches = path.match(/\/vibe-check\/share\/([a-zA-Z0-9]+)/);
    
    if (matches && matches[1]) {
      setShareId(matches[1]);
      fetchSharedVibeCheck(matches[1]);
    } else {
      setError("Invalid shared Vibe Check URL");
      setIsLoading(false);
    }
  }, []);

  const fetchSharedVibeCheck = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/vibe-check/share/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load shared Vibe Check");
      }
      
      const data = await response.json();
      setEvaluationResult(data.evaluation);
      setProjectDetails({
        projectDescription: data.projectDescription,
        createdAt: new Date(data.createdAt).toLocaleDateString(),
      });
    } catch (error) {
      console.error("Error fetching shared Vibe Check:", error);
      setError(error instanceof Error ? error.message : "Failed to load shared Vibe Check");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle creating your own Vibe Check
  const handleStartNewVibeCheck = () => {
    setLocation("/vibe-check");
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="relative mb-6">
            <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-t-4 border-t-primary animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-medium mb-3">Loading Shared Vibe Check</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Please wait while we retrieve the shared evaluation...
          </p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Alert variant="destructive" className="max-w-lg mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <p className="text-muted-foreground mb-6 text-center">
            The shared Vibe Check could not be loaded. It may have been deleted or made private.
          </p>
          <Button onClick={handleStartNewVibeCheck}>Create Your Own Vibe Check</Button>
        </div>
      </div>
    );
  }

  // Render evaluation results
  if (!evaluationResult) return null;

  return (
    <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">Shared</Badge>
            <h2 className="text-2xl font-bold">Vibe Check Results</h2>
          </div>
          {projectDetails && (
            <div className="text-muted-foreground text-sm flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Evaluated on {projectDetails.createdAt}
            </div>
          )}
        </div>
        <Button 
          onClick={handleStartNewVibeCheck}
          className="text-sm"
        >
          Create Your Own Vibe Check
        </Button>
      </div>
      
      {/* Project Description */}
      {projectDetails?.projectDescription && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">Project Description</h3>
          <p className="text-muted-foreground text-sm">
            {projectDetails.projectDescription}
          </p>
        </div>
      )}
      
      {/* Vibe Score and Explanation Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            {/* Vibe Score */}
            <div className="flex flex-col items-center justify-center sm:border-r sm:border-primary/20 sm:pr-6 mb-4 sm:mb-0">
              <span className="text-sm text-muted-foreground mb-1">Vibe Score</span>
              <span className="text-4xl font-bold text-primary">{evaluationResult.fitScore}</span>
              <span className="text-xs text-muted-foreground">out of 100</span>
            </div>
            
            {/* Fit Score Explanation */}
            <div className="flex-1">
              <h3 className="font-medium text-sm mb-2">Fit Score Explanation</h3>
              <p className="text-sm text-muted-foreground">
                {evaluationResult.fitScoreExplanation ? 
                  evaluationResult.fitScoreExplanation : 
                  "This score represents how well the idea fits the market and its potential for success."}
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
          <TabsTrigger value="value-proposition" className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Value Proposition
          </TabsTrigger>
          <TabsTrigger value="target-audience" className="flex items-center gap-1">
            <Target className="h-4 w-4" /> Target Audience
          </TabsTrigger>
          <TabsTrigger value="competition" className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" /> Competition
          </TabsTrigger>
          
          {/* Group 2: Building the business */}
          <TabsTrigger value="risks" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> Risks
          </TabsTrigger>
          <TabsTrigger value="business-plan" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" /> Business Plan
          </TabsTrigger>
          
          {/* Group 3: Taking action */}
          <TabsTrigger value="launch-strategy" className="flex items-center gap-1">
            <Rocket className="h-4 w-4" /> Launch Strategy
          </TabsTrigger>
          <TabsTrigger value="bootstrapping" className="flex items-center gap-1">
            <HandHelping className="h-4 w-4" /> Bootstrapping
          </TabsTrigger>
          <TabsTrigger value="customer-acquisition" className="flex items-center gap-1">
            <Users className="h-4 w-4" /> Customer Acquisition
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
                <div>
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
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Value Proposition Tab */}
        <TabsContent value="value-proposition" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-6">Value Proposition</h3>
              
              {evaluationResult.valueProposition ? (
                <div className="bg-muted p-6 rounded-lg border border-border italic text-lg leading-relaxed">
                  "{evaluationResult.valueProposition}"
                </div>
              ) : (
                <p>No value proposition available for this evaluation.</p>
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
                            <h6 className="text-sm font-medium text-green-600 mb-1">Strengths:</h6>
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
                            <h6 className="text-sm font-medium text-red-600 mb-1">Weaknesses:</h6>
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
        
        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-6">Risk Assessment</h3>
              
              {evaluationResult.riskAssessment?.risks && evaluationResult.riskAssessment.risks.length > 0 ? (
                <div className="space-y-6">
                  {evaluationResult.riskAssessment.risks.map((risk: any, index: number) => (
                    <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50/30">
                      <h4 className="text-lg font-medium mb-2 text-red-700">{risk.type}</h4>
                      <p className="mb-4">{risk.description}</p>
                      
                      {risk.mitigation && (
                        <div className="bg-green-50/30 border border-green-200 p-3 rounded-md">
                          <h5 className="text-sm font-semibold text-green-700 mb-1">Mitigation Strategy:</h5>
                          <p className="text-sm">{risk.mitigation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No risk assessment available for this evaluation.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Business Plan Tab */}
        <TabsContent value="business-plan" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-medium mb-6">Business Plan</h3>
              
              {evaluationResult.businessPlan ? (
                <div className="space-y-6">
                  {evaluationResult.businessPlan.revenueModel && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Revenue Model</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.businessPlan.revenueModel}</p>
                    </div>
                  )}
                  
                  {evaluationResult.businessPlan.goToMarket && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Go-To-Market Strategy</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.businessPlan.goToMarket}</p>
                    </div>
                  )}
                  
                  {evaluationResult.businessPlan.milestones && evaluationResult.businessPlan.milestones.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Key Milestones</h4>
                      <ol className="list-decimal pl-5 space-y-2">
                        {evaluationResult.businessPlan.milestones.map((milestone: string, index: number) => (
                          <li key={index} className="pl-1">{milestone}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ) : (
                <p>No business plan available for this evaluation.</p>
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
                            <div className="h-5 w-5 border rounded flex-shrink-0 mt-0.5"></div>
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
                </div>
              ) : (
                <p>No launch strategy available for this evaluation.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Bootstrapping Tab */}
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
                            <DollarSign className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
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
                </div>
              ) : (
                <p>No bootstrapping guide available for this evaluation.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Customer Acquisition Tab */}
        <TabsContent value="customer-acquisition" className="space-y-6">
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
                            <Users className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <span>{channel}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {evaluationResult.customerAcquisition.costPerAcquisition && (
                    <div>
                      <h4 className="text-lg font-medium mb-3">Cost Per Acquisition</h4>
                      <p className="bg-muted/50 p-4 rounded-md">{evaluationResult.customerAcquisition.costPerAcquisition}</p>
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
                            <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <span>{tactic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p>No customer acquisition details available for this evaluation.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
      </Tabs>
      
      <div className="pt-4 pb-8 text-center text-sm text-muted-foreground">
        <p>This is a shared Vibe Check evaluation. <Button onClick={handleStartNewVibeCheck} variant="link" className="p-0 h-auto text-sm">Create your own Vibe Check</Button> to evaluate your business idea.</p>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Brain, BarChart3, CheckCircle2, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the form schema
const vibeCheckFormSchema = z.object({
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  websiteUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  projectDescription: z.string().min(10, "Please provide at least 10 characters"),
  desiredVibe: z.string().optional(),
});

type VibeCheckFormValues = z.infer<typeof vibeCheckFormSchema>;

export default function VibeCheck() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("market-fit");
  const [progress, setProgress] = useState(0);
  
  // Determine if user is authenticated by checking user existence
  const isAuthenticated = !!user;
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [isShowingResults, setIsShowingResults] = useState(false);
  const [vibeCheckId, setVibeCheckId] = useState<number | null>(null);

  // Initialize the form
  const form = useForm<VibeCheckFormValues>({
    resolver: zodResolver(vibeCheckFormSchema),
    defaultValues: {
      email: "",
      websiteUrl: "",
      projectDescription: "",
      desiredVibe: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: VibeCheckFormValues) => {
    console.log("Submitting vibe check form:", data);
    setIsSubmitting(true);
    setProgress(0);
    setEvaluationResult(null);

    // Simulate progress updates with an interval
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 5;
        return newProgress > 95 ? 95 : newProgress;
      });
    }, 1000);

    try {
      const response = await fetch("/api/vibe-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate evaluation");
      }

      const result = await response.json();
      console.log("Vibe check result:", result);
      
      setEvaluationResult(result.evaluation);
      setVibeCheckId(result.vibeCheckId);
      setIsShowingResults(true);

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
        description: error instanceof Error ? error.message : "Failed to generate evaluation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save the vibeCheckId to session storage for after login
  const storeVibeCheckAndRedirect = () => {
    if (vibeCheckId) {
      // Store the vibe check ID in session storage so we can convert it after login
      sessionStorage.setItem('pendingVibeCheckId', vibeCheckId.toString());
      
      // Redirect to auth page
      window.location.href = '/auth';
    }
  };
  
  // Save vibe check as project
  const saveAsProject = async () => {
    if (!vibeCheckId) return;

    // If user is not logged in, store ID and redirect to login
    if (!isAuthenticated) {
      storeVibeCheckAndRedirect();
      return;
    }

    try {
      const response = await fetch(`/api/vibe-check/${vibeCheckId}/convert-to-project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPrivate: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // If authentication error, redirect to login
        if (response.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please log in to save this vibe check as a project",
          });
          storeVibeCheckAndRedirect();
          return;
        }
        
        if (errorData.error?.includes("already been converted")) {
          toast({
            title: "Already Saved",
            description: "This evaluation has already been saved as a project",
          });
          return;
        }
        throw new Error(errorData.error || "Failed to save as project");
      }

      const result = await response.json();
      console.log("Converted to project:", result);

      toast({
        title: "Success!",
        description: "Your vibe check has been saved as a project",
      });
      
      // Navigate to the new project page
      window.location.href = `/projects/${result.projectId}`;
    } catch (error) {
      console.error("Error saving as project:", error);
      toast({
        title: "Failed to Save",
        description: error instanceof Error ? error.message : "Failed to save as project",
        variant: "destructive",
      });
    }
  };

  // Render loading/evaluation progress
  const renderEvaluationProgress = () => (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="relative mb-6">
        <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-t-4 border-t-primary animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain className="h-10 w-10 text-primary" />
        </div>
      </div>
      <h3 className="text-2xl font-medium mb-3">AI Vibe Check in Progress</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Our AI is analyzing your project idea and generating a comprehensive business evaluation.
        This typically takes 30-60 seconds.
      </p>
      <Progress className="h-2 w-full max-w-md mx-auto mb-3" value={progress} />
      <p className="text-sm text-muted-foreground">{progress < 100 ? "Analyzing..." : "Analysis complete!"}</p>
    </div>
  );

  // Render evaluation results
  const renderEvaluationResults = () => {
    if (!evaluationResult) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Vibe Check Results</h2>
            <p className="text-muted-foreground text-sm">AI-powered comprehensive business evaluation</p>
          </div>
          <div className="flex flex-col items-center bg-gradient-to-br from-primary/10 to-primary/5 p-3 rounded-lg border shadow-sm">
            <span className="text-xs text-muted-foreground mb-1">Vibe Score</span>
            <span className="text-3xl font-bold text-primary">{evaluationResult.fitScore}</span>
            <span className="text-xs text-muted-foreground">out of 100</span>
          </div>
        </div>

        <Tabs defaultValue="market-fit" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-2 h-auto mb-4">
            <TabsTrigger value="market-fit">Market Fit</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
            <TabsTrigger value="launch">Launch</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="bootstrapping">Bootstrapping</TabsTrigger>
          </TabsList>

          {/* Market Fit Tab */}
          <TabsContent value="market-fit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Fit Analysis</CardTitle>
                <CardDescription>
                  Analysis of your project's strengths, weaknesses and market potential
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Strengths */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Strengths</h3>
                  <ul className="space-y-2">
                    {evaluationResult.marketFitAnalysis.strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Weaknesses */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Areas for Improvement</h3>
                  <ul className="space-y-2">
                    {evaluationResult.marketFitAnalysis.weaknesses.map((weakness: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <ArrowRight className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Demand Potential */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Market Demand Potential</h3>
                  <p className="text-muted-foreground">{evaluationResult.marketFitAnalysis.demandPotential}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Value Proposition</CardTitle>
                <CardDescription>The core value your project provides</CardDescription>
              </CardHeader>
              <CardContent>
                <blockquote className="italic border-l-4 border-primary/30 pl-4 py-2 text-lg">
                  "{evaluationResult.valueProposition}"
                </blockquote>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Target Audience</CardTitle>
                <CardDescription>Who your project serves best</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Demographics</h3>
                  <p className="text-muted-foreground">{evaluationResult.targetAudience.demographic}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Psychographics</h3>
                  <p className="text-muted-foreground">{evaluationResult.targetAudience.psychographic}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Competitive Landscape</CardTitle>
                <CardDescription>Your position among competitors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {evaluationResult.competitiveLandscape.competitors.map((competitor: any, index: number) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <h4 className="font-medium mb-1">{competitor.name}</h4>
                      <p className="text-sm text-muted-foreground">{competitor.differentiation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Tab */}
          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Plan</CardTitle>
                <CardDescription>Monetization and go-to-market strategies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Revenue Model</h3>
                  <p className="text-muted-foreground">{evaluationResult.businessPlan.revenueModel}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Go-to-Market Strategy</h3>
                  <p className="text-muted-foreground">{evaluationResult.businessPlan.goToMarket}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Key Milestones</h3>
                  <ul className="space-y-2">
                    {evaluationResult.businessPlan.milestones.map((milestone: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs">{index + 1}</span>
                        </div>
                        <span>{milestone}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Partnership Opportunities</CardTitle>
                <CardDescription>Potential strategic partners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {evaluationResult.partnershipOpportunities.partners.map((partner: string, index: number) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {partner}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Technical Feasibility</CardTitle>
                <CardDescription>Implementation analysis for vibe coding</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{evaluationResult.technicalFeasibility}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Regulatory Considerations</CardTitle>
                <CardDescription>Legal and compliance requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{evaluationResult.regulatoryConsiderations}</p>
              </CardContent>
            </Card>
            
            {evaluationResult.implementationRoadmap && (
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Roadmap</CardTitle>
                  <CardDescription>Phased approach to building your project</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {evaluationResult.implementationRoadmap.phases.map((phase: any, phaseIndex: number) => (
                    <div key={phaseIndex} className="border-b pb-4 last:border-b-0">
                      <h4 className="font-medium mb-2">{phase.timeframe}</h4>
                      
                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-1">Tasks:</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {phase.tasks.map((task: string, taskIndex: number) => (
                            <li key={taskIndex} className="flex items-start gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary/70 mt-1.5" />
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-1">Success Metrics:</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {phase.metrics.map((metric: string, metricIndex: number) => (
                            <li key={metricIndex} className="flex items-start gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5" />
                              <span>{metric}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Risks Tab */}
          <TabsContent value="risks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>Potential challenges and mitigation strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {evaluationResult.riskAssessment.risks.map((risk: any, index: number) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{risk.type}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                      <div>
                        <h5 className="text-sm font-medium mb-1">Mitigation Strategy:</h5>
                        <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Fit Score Explanation</CardTitle>
                <CardDescription>Understanding your project's viability score</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{evaluationResult.fitScoreExplanation}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Launch Strategy Tab */}
          <TabsContent value="launch" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Launch Strategy</CardTitle>
                <CardDescription>
                  Key components for a successful product launch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* MVP Features */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Critical MVP Features</h3>
                  <ul className="space-y-2">
                    {evaluationResult?.launchStrategy?.mvpFeatures?.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs">{index + 1}</span>
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Time to Market */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Time to Market</h3>
                  <p className="text-muted-foreground">{evaluationResult?.launchStrategy?.timeToMarket}</p>
                </div>
                
                {/* Market Entry Approach */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Market Entry Approach</h3>
                  <p className="text-muted-foreground">{evaluationResult?.launchStrategy?.marketEntryApproach}</p>
                </div>
                
                {/* Critical Resources */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Critical Resources</h3>
                  <ul className="space-y-2">
                    {evaluationResult?.launchStrategy?.criticalResources?.map((resource: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/70 mt-1.5" />
                        <span>{resource}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Launch Checklist */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Launch Checklist</h3>
                  <ul className="space-y-2">
                    {evaluationResult?.launchStrategy?.launchChecklist?.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="text-green-500 flex-shrink-0 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                          </svg>
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Acquisition Tab */}
          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Acquisition Strategy</CardTitle>
                <CardDescription>
                  Strategies for attracting and retaining customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Channels */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Primary Acquisition Channels</h3>
                  <div className="flex flex-wrap gap-2">
                    {evaluationResult?.customerAcquisition?.primaryChannels?.map((channel: string, index: number) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Acquisition Cost */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Customer Acquisition Cost</h3>
                  <p className="text-muted-foreground">{evaluationResult?.customerAcquisition?.acquisitionCost}</p>
                </div>
                
                {/* Conversion Strategy */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Conversion Strategy</h3>
                  <p className="text-muted-foreground">{evaluationResult?.customerAcquisition?.conversionStrategy}</p>
                </div>
                
                {/* Retention Tactics */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Retention Tactics</h3>
                  <ul className="space-y-2">
                    {evaluationResult?.customerAcquisition?.retentionTactics?.map((tactic: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/70 mt-1.5" />
                        <span>{tactic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Growth Opportunities */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Growth Opportunities</h3>
                  <p className="text-muted-foreground">{evaluationResult?.customerAcquisition?.growthOpportunities}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Generation Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Generation Models</CardTitle>
                <CardDescription>
                  Strategies for monetizing your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Business Models */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Viable Business Models</h3>
                  <div className="flex flex-wrap gap-2">
                    {evaluationResult?.revenueGeneration?.businessModels?.map((model: string, index: number) => (
                      <Badge key={index} variant="outline" className="px-3 py-1">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Pricing Strategy */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Pricing Strategy</h3>
                  <p className="text-muted-foreground">{evaluationResult?.revenueGeneration?.pricingStrategy}</p>
                </div>
                
                {/* Revenue Streams */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Revenue Streams</h3>
                  <ul className="space-y-2">
                    {evaluationResult?.revenueGeneration?.revenueStreams?.map((stream: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs">{index + 1}</span>
                        </div>
                        <span>{stream}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Unit Economics */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Unit Economics</h3>
                  <p className="text-muted-foreground">{evaluationResult?.revenueGeneration?.unitEconomics}</p>
                </div>
                
                {/* Scaling Potential */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Scaling Potential</h3>
                  <p className="text-muted-foreground">{evaluationResult?.revenueGeneration?.scalingPotential}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bootstrapping Guide Tab */}
          <TabsContent value="bootstrapping" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bootstrapping Guide</CardTitle>
                <CardDescription>
                  DIY strategies for solo developers on a budget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cost Minimization Tips */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Cost Minimization Tips</h3>
                  <ul className="space-y-2">
                    {evaluationResult?.bootstrappingGuide?.costMinimizationTips?.map((tip: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs">💰</span>
                        </div>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* DIY Solutions */}
                <div>
                  <h3 className="text-lg font-medium mb-2">DIY Solutions & Free Tools</h3>
                  <p className="text-muted-foreground">{evaluationResult?.bootstrappingGuide?.diySolutions}</p>
                </div>
                
                {/* Growth Without Funding */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Organic Growth Strategies</h3>
                  <p className="text-muted-foreground">{evaluationResult?.bootstrappingGuide?.growthWithoutFunding}</p>
                </div>
                
                {/* Time Management */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Solo Developer Time Management</h3>
                  <p className="text-muted-foreground">{evaluationResult?.bootstrappingGuide?.timeManagement}</p>
                </div>
                
                {/* Milestones on Budget */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Achievable Milestones on a Budget</h3>
                  <ul className="space-y-2">
                    {evaluationResult?.bootstrappingGuide?.milestonesOnBudget?.map((milestone: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="text-emerald-500 flex-shrink-0 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
                          </svg>
                        </div>
                        <span>{milestone}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Card>
          <CardHeader>
            <CardTitle>Save Your Vibe Check</CardTitle>
            <CardDescription>
              {isAuthenticated 
                ? "Add this evaluation to your projects" 
                : "Create an account to save this evaluation as a project"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAuthenticated ? (
              <div className="flex flex-col gap-4">
                <p className="mb-2">This evaluation can be saved to your profile as a project.</p>
                <Button onClick={saveAsProject}>
                  Save as Project
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="mb-2">Want to save this evaluation and share it with others? Create an account (or log in) to add this as a project on your profile.</p>
                <div className="flex gap-4">
                  <Button onClick={saveAsProject}>
                    Save as Project
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = '/auth'}>
                    Log In / Sign Up
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Vibe Check</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Get a comprehensive AI-powered evaluation for your vibe coding project idea.
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              <Brain className="h-4 w-4 mr-1" /> AI Analysis
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <BarChart3 className="h-4 w-4 mr-1" /> Business Insights
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Development Guidance
            </Badge>
          </div>
        </div>

        {isShowingResults ? (
          renderEvaluationResults()
        ) : isSubmitting ? (
          renderEvaluationProgress()
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Get Your Vibe Check</CardTitle>
              <CardDescription>
                Tell us about your project idea and we'll provide an AI-powered business evaluation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="your@email.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Existing Website URL (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://yourwebsite.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="projectDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your project idea, its purpose, features, and target audience..." 
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="desiredVibe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desired Vibe/Style (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the aesthetic, style, or 'vibe' you're aiming for with this project..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>Get Your Vibe Check</>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col items-center text-center border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Powered by OpenAI's GPT-4o model for accurate and insightful business analysis
              </p>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
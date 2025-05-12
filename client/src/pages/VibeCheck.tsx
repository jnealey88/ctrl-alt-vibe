import { useState, useEffect } from "react";
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
import { 
  Loader2, 
  Brain, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight, 
  Target, 
  Briefcase, 
  Code, 
  AlertTriangle, 
  Rocket, 
  Users, 
  DollarSign, 
  HandHelping,
  FileDown,
  Download
} from "lucide-react";
import { generateVibeCheckPdf } from "../utils/pdfExport";
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  // Market-fit remains the first tab in our logical progression
  const [activeTab, setActiveTab] = useState("market-fit");
  const [progress, setProgress] = useState(0);
  
  // Determine if user is authenticated by checking user existence
  const isAuthenticated = !!user;
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [isShowingResults, setIsShowingResults] = useState(false);
  const [vibeCheckId, setVibeCheckId] = useState<number | null>(null);

  // Load saved vibe check results from session storage on component mount
  useEffect(() => {
    try {
      const savedVibeCheck = sessionStorage.getItem("savedVibeCheck");
      if (savedVibeCheck) {
        const { evaluation, id } = JSON.parse(savedVibeCheck);
        setEvaluationResult(evaluation);
        setVibeCheckId(id);
        setIsShowingResults(true);
        console.log("Loaded vibe check from session storage");
      }
    } catch (error) {
      console.error("Error loading vibe check from session storage:", error);
    }
  }, []);

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
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

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
      
      // Save vibe check results to session storage
      try {
        sessionStorage.setItem("savedVibeCheck", JSON.stringify({
          evaluation: result.evaluation,
          id: result.vibeCheckId
        }));
        console.log("Saved vibe check to session storage");
      } catch (error) {
        console.error("Error saving vibe check to session storage:", error);
      }
      
      // Ensure we're at the top of the page when showing results
      window.scrollTo({ top: 0, behavior: 'smooth' });

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
  
  // Reset vibe check and clear session storage
  const resetVibeCheck = () => {
    try {
      // Clear session storage
      sessionStorage.removeItem("savedVibeCheck");
      
      // Reset state
      setEvaluationResult(null);
      setVibeCheckId(null);
      setIsShowingResults(false);
      // Reset to the first tab in our progression
      setActiveTab("market-fit");
      
      // Reset form
      form.reset();
      
      toast({
        title: "Vibe Check Reset",
        description: "You can now start a new vibe check",
      });
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Error resetting vibe check:", error);
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

  // Export the current vibe check to PDF
  const handleExportToPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await generateVibeCheckPdf(evaluationResult, {
        title: 'Vibe Check Results',
        filename: `vibe-check-${new Date().toISOString().slice(0, 10)}.pdf`,
        pageSize: 'a4',
        orientation: 'portrait'
      });
      toast({
        title: "PDF Generated Successfully",
        description: "Your Vibe Check report has been downloaded as a PDF",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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
          <div className="flex space-x-4 items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetVibeCheck}
              className="text-xs"
            >
              Try Another Idea
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToPdf}
              disabled={isGeneratingPdf}
              className="text-xs flex items-center gap-1"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown className="h-3.5 w-3.5" />
                  Export to PDF
                </>
              )}
            </Button>
            <div className="flex flex-col items-center bg-gradient-to-br from-primary/10 to-primary/5 p-3 rounded-lg border shadow-sm">
              <span className="text-xs text-muted-foreground mb-1">Vibe Score</span>
              <span className="text-3xl font-bold text-primary">{evaluationResult.fitScore}</span>
              <span className="text-xs text-muted-foreground">out of 100</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="market-fit" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-2 h-auto mb-4">
            {/* Group 1: Understanding the idea */}
            <TabsTrigger value="market-fit" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" /> Market Fit
            </TabsTrigger>
            <TabsTrigger value="audience" className="flex items-center gap-1">
              <Target className="h-4 w-4" /> Audience
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center gap-1">
              <Code className="h-4 w-4" /> Technical
            </TabsTrigger>
            
            {/* Group 2: Building the business */}
            <TabsTrigger value="business" className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" /> Business
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" /> Revenue
            </TabsTrigger>
            <TabsTrigger value="risks" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> Risks
            </TabsTrigger>
            
            {/* Group 3: Taking action */}
            <TabsTrigger value="customers" className="flex items-center gap-1">
              <Users className="h-4 w-4" /> Customers
            </TabsTrigger>
            <TabsTrigger value="launch" className="flex items-center gap-1">
              <Rocket className="h-4 w-4" /> Launch
            </TabsTrigger>
            <TabsTrigger value="bootstrapping" className="flex items-center gap-1">
              <HandHelping className="h-4 w-4" /> Bootstrapping
            </TabsTrigger>
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
                {/* Market Positioning Overview - if available */}
                {evaluationResult.competitiveLandscape.marketPositioning && (
                  <div className="mb-6 bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Market Positioning</h3>
                    <p className="text-sm text-muted-foreground">
                      {evaluationResult.competitiveLandscape.marketPositioning}
                    </p>
                  </div>
                )}
                
                {/* Competitive Advantages - if available */}
                {evaluationResult.competitiveLandscape.competitiveAdvantages && evaluationResult.competitiveLandscape.competitiveAdvantages.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Your Competitive Advantages</h3>
                    <ul className="space-y-2">
                      {evaluationResult.competitiveLandscape.competitiveAdvantages.map((advantage: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-medium text-sm mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-sm">{advantage}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Differentiation Strategy - if available */}
                {evaluationResult.competitiveLandscape.differentiationStrategy && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Differentiation Strategy</h3>
                    <p className="text-sm text-muted-foreground">
                      {evaluationResult.competitiveLandscape.differentiationStrategy}
                    </p>
                  </div>
                )}
                
                {/* Competitors Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Competitor Analysis</h3>
                  <div className="space-y-6">
                    {evaluationResult.competitiveLandscape.competitors.map((competitor: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 shadow-sm">
                        <h4 className="font-medium text-lg mb-2 flex items-center">
                          <span className="mr-2">{competitor.name}</span> 
                          {competitor.marketPosition && (
                            <span className="text-xs font-normal px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {competitor.marketPosition}
                            </span>
                          )}
                        </h4>
                        
                        {/* Main differentiation */}
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground">{competitor.differentiation}</p>
                        </div>
                        
                        {/* Strengths and Weaknesses in two columns if available */}
                        {(competitor.strengths || competitor.weaknesses) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            {competitor.strengths && competitor.strengths.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium mb-2 text-green-700">Strengths</h5>
                                <ul className="text-sm space-y-1">
                                  {competitor.strengths.map((strength: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-green-500 mt-1">•</span>
                                      <span>{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium mb-2 text-amber-700">Weaknesses</h5>
                                <ul className="text-sm space-y-1">
                                  {competitor.weaknesses.map((weakness: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-amber-500 mt-1">•</span>
                                      <span>{weakness}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Pricing Strategy if available */}
                        {competitor.pricingStrategy && (
                          <div className="mt-3 pt-3 border-t">
                            <h5 className="text-sm font-medium mb-1">Pricing Strategy</h5>
                            <p className="text-sm text-muted-foreground">{competitor.pricingStrategy}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
        {/* Hero Section - Only show full version when not displaying results */}
        {!isShowingResults ? (
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
              Vibe Check Your Next Big Idea
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              Transform your concept into a successful reality with our AI-powered evaluation system. 
              Get insights that 95% of startups wish they had before launching.
            </p>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Stop guessing if your idea will work. Our AI analyzes market fit, audience targeting, 
              and business potential in seconds—giving you the clarity successful founders need.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
              <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-lg border border-violet-100 dark:border-violet-800">
                <Brain className="h-6 w-6 text-violet-600 dark:text-violet-400 mb-2 mx-auto" />
                <h3 className="font-medium mb-1">AI-Powered Analysis</h3>
                <p className="text-sm text-muted-foreground">Make data-driven decisions with our advanced AI evaluation</p>
              </div>
              <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-lg border border-violet-100 dark:border-violet-800">
                <BarChart3 className="h-6 w-6 text-violet-600 dark:text-violet-400 mb-2 mx-auto" />
                <h3 className="font-medium mb-1">Market Insights</h3>
                <p className="text-sm text-muted-foreground">Understand your competition and market position before launching</p>
              </div>
              <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-lg border border-violet-100 dark:border-violet-800">
                <CheckCircle2 className="h-6 w-6 text-violet-600 dark:text-violet-400 mb-2 mx-auto" />
                <h3 className="font-medium mb-1">Launch Strategy</h3>
                <p className="text-sm text-muted-foreground">Get a customized action plan to take your idea from concept to reality</p>
              </div>
            </div>
            
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
        ) : (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400">
              Your Vibe Check Results
            </h1>
            <p className="text-muted-foreground">
              Detailed AI-powered analysis of your business idea
            </p>
          </div>
        )}

        {isShowingResults ? (
          renderEvaluationResults()
        ) : isSubmitting ? (
          renderEvaluationProgress()
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Get Your Vibe Check in Minutes</CardTitle>
              <CardDescription>
                Tell us about your project idea and we'll provide an AI-powered business evaluation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <p className="text-base">Share your idea below and our AI will analyze its potential through multiple lenses:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Market fit analysis and demand prediction</li>
                  <li>Target audience profiling and size estimation</li>
                  <li>Competitive landscape analysis</li>
                  <li>Revenue model suggestions and business strategy</li>
                  <li>Technical feasibility assessment</li>
                  <li>Detailed bootstrapping guide and launch strategy</li>
                </ul>
                <p className="font-medium text-violet-600 dark:text-violet-400 pt-2">
                  Stop wondering if your idea has potential—get actionable insights now!
                </p>
              </div>
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
                            placeholder="Describe your project idea in detail. What problem does it solve? Who is it for? What are the main features? The more specific you are, the more accurate your vibe check will be!" 
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
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-6 text-lg font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing Your Idea...
                      </>
                    ) : (
                      <>Get Your Free Vibe Check Now</>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col items-center text-center border-t pt-6">
              <div className="space-y-4 w-full">
                <div className="flex flex-wrap justify-center gap-3">
                  <Badge className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40">95% Accuracy</Badge>
                  <Badge className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40">30-60 Second Analysis</Badge>
                  <Badge className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/40">8-Point Evaluation</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Powered by OpenAI's GPT-4o model for accurate and insightful business analysis
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Over 500 entrepreneurs have used Vibe Check to validate their ideas before investing time and resources into development
                </p>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
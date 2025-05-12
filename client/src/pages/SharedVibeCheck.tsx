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

        {/* Tab Contents (same as regular VibeCheck, just read-only) */}
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
        
        {/* Rest of the tabs would follow the same pattern... */}
        
      </Tabs>
      
      <div className="pt-4 pb-8 text-center text-sm text-muted-foreground">
        <p>This is a shared Vibe Check evaluation. <Button onClick={handleStartNewVibeCheck} variant="link" className="p-0 h-auto text-sm">Create your own Vibe Check</Button> to evaluate your business idea.</p>
      </div>
    </div>
  );
}
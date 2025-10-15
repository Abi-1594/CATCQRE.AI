"use client"

import { useState, useTransition, useEffect } from "react"
import {
  processFile,
  processAddressCleansing,
  processSchemeCoding,
  processOtherModifiers,
  processCatnetModifiers,
  processExposure,
  processHazardAnalysis,
  generateOutputFile,
  learnFromOutputFile,
} from "@/app/actions"
import type { AppState, FieldMapping, Step, BusinessRules } from "@/lib/types"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, BrainCircuit, Trash2, BarChart2, ArrowLeft, Settings } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

import FileUploadStep from "./steps/1-file-upload"
import HeaderMappingStep from "./steps/2-header-mapping"
import BusinessRulesStep from "./steps/3-business-rules"
import GeocodingStep from "./steps/4-geocoding"
import OccConstCodingStep from "./steps/5-occ-const-coding"
import OtherModifiersStep from "./steps/6-other-modifiers"
import CatnetModifiersStep from "./steps/7-catnet-modifiers"
import CatnetModifiersStep6 from "./steps/6-catnet-modifiers"
import ExposureStep from "./steps/8-exposure"
import HazardAnalysisStep from "./steps/9-hazard-analysis"
import DataSummaryStep from "./steps/10-data-summary"
import GenerateOutputStep from "./steps/11-generate-output"
import SpatialAnalysisDashboard from "./spatial-analysis-dashboard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  getGeocodingCache,
  updateGeocodingCache,
  getSchemeCodingCache,
  clearAllCaches,
  getLearnedHeaders,
  saveLearnedHeader,
  type GeocodingCache,
  type SchemeCodingCache,
} from "@/lib/cache"
import { OUTPUT_COLUMN_SEQUENCE } from "@/lib/constants"
import AgentStatusIndicator from "./agent-status-indicator"
import PopupAIAssistant from "./popup-ai-assistant"

const initialAppState: AppState = {
  currentStep: 1,
  file: null,
  accountName: "",
  lineOfBusiness: "Property",
  originalHeaders: [],
  data: [],
  fieldMapping: {},
  businessRules: {
    maxStoriesThreshold: 3,
    storiesExceededAction: "none",
    minYearBuilt: 1800,
    maxYearBuilt: new Date().getFullYear(),
    invalidYearAction: "none",
    defaultYearBuilt: 1980,
    minSquareFootage: 100,
    invalidSqftAction: "none",
    defaultSquareFootage: 5000,
    occupancyConfidenceThreshold: 0.7,
    constructionConfidenceThreshold: 0.7,
    maxBuildingValue: 100000000,
    maxContentsValue: 50000000,
    maxBIValue: 25000000,
    invalidValueAction: "none",
    defaultOccupancyForMisc: "37",
  },
  processingLog: [],
  progress: 0,
  error: null,
  processedData: null,
  outputCsv: null,
}

const steps: Step[] = [
  { id: 1, name: "File Upload" },
  { id: 2, name: "Header Mapping" },
  { id: 3, name: "Geocoding" },
  { id: 4, name: "Occupancy & Construction Coding" },
  { id: 5, name: "Other Modifiers Coding" },
  { id: 6, name: "CATNET Modifiers (Primary)" },
  { id: 7, name: "CATNET Modifiers (Secondary)" },
  { id: 8, name: "Exposure" },
  { id: 9, name: "Hazard & Geospatial Analysis" },
  { id: 10, name: "Data Summary" },
  { id: 11, name: "Generate Output" },
]

export default function CatScrub() {
  const [state, setState] = useState<AppState>(initialAppState)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("workflow")

  const [agentStatus, setAgentStatus] = useState<"idle" | "thinking" | "processing" | "complete" | "error">("idle")
  const [currentAgentAction, setCurrentAgentAction] = useState<string>()
  const [agentConfidence, setAgentConfidence] = useState<number>()
  const [lastAgentDecision, setLastAgentDecision] = useState<string>()
  const [workflowPaused, setWorkflowPaused] = useState(false)

  const [geocodingCache, setGeocodingCache] = useState<GeocodingCache>({})
  const [schemeCache, setSchemeCache] = useState<SchemeCodingCache>({})

  useEffect(() => {
    setGeocodingCache(getGeocodingCache())
    setSchemeCache(getSchemeCodingCache())
  }, [])

  const resetState = () => {
    setState(initialAppState)
    setActiveTab("workflow")
  }

  const handleBackStep = () => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(1, prev.currentStep - 1),
      error: null,
    }))
    setAgentStatus("idle")
    setCurrentAgentAction(undefined)
    setLastAgentDecision(undefined)
  }

  const workflowSteps = steps.map((step, index) => ({
    id: step.id,
    name: step.name,
    status:
      index < state.currentStep - 1
        ? ("complete" as const)
        : index === state.currentStep - 1
          ? ("active" as const)
          : ("pending" as const),
    confidence: index < state.currentStep - 1 ? 0.95 : index === state.currentStep - 1 ? agentConfidence : undefined,
    aiDecision:
      index < state.currentStep - 1
        ? "Automatically processed with high confidence"
        : index === state.currentStep - 1
          ? lastAgentDecision
          : undefined,
    estimatedTime: index > state.currentStep - 1 ? "2-5 min" : undefined,
  }))

  const handleAction = (action: (...args: any[]) => Promise<any>, ...args: any[]) => {
    setAgentStatus("processing")
    setCurrentAgentAction(`Processing ${steps[state.currentStep - 1]?.name}`)

    startTransition(async () => {
      try {
        const result = await action(...args)
        if (result.error) {
          setState((prev) => ({ ...prev, error: result.error }))
          setAgentStatus("error")
          setLastAgentDecision(`Error encountered: ${result.error}`)
        } else {
          const isFinalStep = state.currentStep + 1 > steps.length
          setState((prev) => ({
            ...prev,
            ...result,
            currentStep: prev.currentStep + 1,
            error: null,
          }))
          setAgentStatus("complete")
          setAgentConfidence(0.92)
          setLastAgentDecision(`Successfully completed ${steps[state.currentStep - 1]?.name}`)

          if (isFinalStep) {
            setActiveTab("analysis")
          }
        }
      } catch (e: any) {
        setState((prev) => ({ ...prev, error: e.message || "An unexpected error occurred." }))
        setAgentStatus("error")
        setLastAgentDecision(`Unexpected error: ${e.message}`)
      }
    })
  }

  const handleAgentAction = (action: string, data?: any) => {
    switch (action) {
      case "proceed_next_step":
        if (state.currentStep <= steps.length) {
          // Trigger next step based on current step
          const currentStepId = state.currentStep
          if (currentStepId === 4 && state.processedData) {
            handleSchemeCoding()
          } else if (currentStepId === 5 && state.processedData) {
            handleOtherModifiers()
          }
          // Add more step handlers as needed
        }
        break
      default:
        console.log("Unknown agent action:", action)
    }
  }

  const handleFileUpload = (file: File, accountName: string, lineOfBusiness: string, businessRules: BusinessRules) => {
    setState((prev) => ({
      ...prev,
      file,
      accountName,
      lineOfBusiness,
      businessRules,
      processingLog: [...prev.processingLog, "File selected. Processing..."],
    }))
    handleAction(processFile, file)
  }

  const handleHeaderMapping = (mapping: FieldMapping) => {
    // Capture manual mappings for learning
    const learnedHeaders = getLearnedHeaders()

    Object.entries(mapping).forEach(([field, header]) => {
      if (header && learnedHeaders[header] !== field) {
        saveLearnedHeader(header, field)
      }
    })

    setState((prev) => ({
      ...prev,
      fieldMapping: mapping,
      processingLog: [...prev.processingLog, "Headers mapped. Starting geocoding..."],
    }))

    // Proceed to geocoding immediately
    startTransition(async () => {
      const {
        data: allRows,
        fieldMapping: currentMapping,
        businessRules: currentRules,
      } = { ...state, fieldMapping: mapping }
      const cachedResults: Record<string, any>[] = []
      const rowsToProcess: Record<string, any>[] = []

      allRows.forEach((row) => {
        const fullAddress = currentMapping["Full Address"] ? row[currentMapping["Full Address"]] : ""
        const street = currentMapping.Street ? row[currentMapping.Street] : ""
        const city = currentMapping.City ? row[currentMapping.City] : ""
        const postal = currentMapping["Postal Code"] ? row[currentMapping["Postal Code"]] : ""
        const country = currentMapping.Country ? row[currentMapping.Country] : ""
        const addressKey = fullAddress || [street, city, postal, country].filter(Boolean).join(", ")

        if (addressKey && geocodingCache[addressKey]) {
          const cacheItem = geocodingCache[addressKey]
          cachedResults.push({
            ...row,
            Latitude: cacheItem.lat,
            Longitude: cacheItem.lon,
            Street_Final: cacheItem.street,
            City_Final: cacheItem.city,
            County_Final: cacheItem.county,
            State_Final: cacheItem.state,
            Postal_Final: cacheItem.postal,
            Country_Final: cacheItem.country,
            _isCached: true,
          })
        } else {
          rowsToProcess.push(row)
        }
      })

      const result = await processAddressCleansing([...cachedResults, ...rowsToProcess], currentMapping)
      if (result.error) {
        setState((prev) => ({ ...prev, error: result.error }))
        return
      }

      const newCacheEntries: GeocodingCache = {}
      result.processedData.forEach((row: any) => {
        if (row.Latitude && row.Longitude && row._geocodingCacheKey && !row._isCached) {
          newCacheEntries[row._geocodingCacheKey] = {
            lat: row.Latitude,
            lon: row.Longitude,
            street: row.Street_Final,
            city: row.City_Final,
            county: row.County_Final,
            state: row.State_Final,
            postal: row.Postal_Final,
            country: row.Country_Final,
          }
        }
      })
      if (Object.keys(newCacheEntries).length > 0) {
        updateGeocodingCache(newCacheEntries)
        setGeocodingCache((prev) => ({ ...prev, ...newCacheEntries }))
      }

      setState((prev) => ({
        ...prev,
        processedData: result.processedData,
        currentStep: prev.currentStep + 1,
        error: null,
      }))
    })
  }

  const handleBusinessRules = (rules: BusinessRules) => {
    setState((prev) => ({
      ...prev,
      businessRules: rules,
      processingLog: [...prev.processingLog, "Business rules configured."],
    }))

    toast({
      title: "Business Rules Updated",
      description: "Your business rules have been saved and will be applied during processing.",
    })
  }

  const handleSchemeCoding = () => {
    if (!state.processedData) return
    setState((prev) => ({
      ...prev,
      processingLog: [...prev.processingLog, "Addresses cleansed. Coding schemes..."],
    }))
    handleAction(processSchemeCoding, state.processedData, state.fieldMapping, state.businessRules)
  }

  const handleOtherModifiers = () => {
    if (!state.processedData) return
    setState((prev) => ({
      ...prev,
      processingLog: [...prev.processingLog, "Schemes coded. Processing modifiers..."],
    }))
    handleAction(processOtherModifiers, state.processedData, state.fieldMapping, state.businessRules)
  }

  const handleCatnetModifiers = () => {
    if (!state.processedData) return
    setState((prev) => ({
      ...prev,
      processingLog: [...prev.processingLog, "Primary modifiers coded. Processing CATNET modifiers (Primary)..."],
    }))
    handleAction(processCatnetModifiers, state.processedData, state.fieldMapping)
  }

  const handleCatnetModifiers2 = () => {
    if (!state.processedData) return
    setState((prev) => ({
      ...prev,
      processingLog: [
        ...prev.processingLog,
        "CATNET modifiers (Primary) processed. Processing CATNET modifiers (Secondary)...",
      ],
    }))
    handleAction(processCatnetModifiers, state.processedData, state.fieldMapping)
  }

  const handleExposure = () => {
    if (!state.processedData) return
    setState((prev) => ({
      ...prev,
      processingLog: [...prev.processingLog, "CATNET modifiers processed. Calculating exposure..."],
    }))
    handleAction(processExposure, state.processedData, state.fieldMapping, state.businessRules)
  }

  const handleHazardAnalysis = () => {
    if (!state.processedData) return
    setState((prev) => ({
      ...prev,
      processingLog: [...prev.processingLog, "Exposure calculated. Analyzing hazards..."],
    }))
    handleAction(processHazardAnalysis, state.processedData)
  }

  const handleDataSummary = () => {
    if (!state.processedData) return
    setState((prev) => ({
      ...prev,
      processingLog: [...prev.processingLog, "Data summary reviewed. Generating output file..."],
      currentStep: prev.currentStep + 1,
      error: null,
    }))
  }

  const handleGenerateOutput = () => {
    if (!state.processedData) return
    setState((prev) => ({
      ...prev,
      processingLog: [...prev.processingLog, "Generating final output file..."],
    }))
    handleAction(generateOutputFile, state.processedData, state.fieldMapping)
  }

  const handleLearnFromFile = (file: File) => {
    startTransition(async () => {
      const result = await learnFromOutputFile(file)
      if (result.error) {
        toast({ title: "Learning Failed", description: result.error, variant: "destructive" })
      } else if (result.newGeocodingCache) {
        updateGeocodingCache(result.newGeocodingCache)
        setGeocodingCache((prev) => ({ ...prev, ...result.newGeocodingCache! }))
        toast({
          title: "Learning Successful",
          description: `Added ${result.learnedCount} new entries to the geocoding cache.`,
        })
      }
    })
  }

  const handleClearCache = () => {
    clearAllCaches()
    setGeocodingCache({})
    setSchemeCache({})
    toast({ title: "Cache Cleared", description: "All learned data has been removed." })
  }

  const handleAmendmentApplied = () => {
    // Placeholder for handleAmendmentApplied logic
  }

  const renderStepContent = () => {
    const currentStepId = state.currentStep > steps.length ? steps.length : state.currentStep
    switch (currentStepId) {
      case 1:
        return (
          <FileUploadStep
            onFileUpload={handleFileUpload}
            isPending={isPending}
            businessRules={state.businessRules}
            onRulesUpdate={(rules) => setState((prev) => ({ ...prev, businessRules: rules }))}
          />
        )
      case 2:
        return (
          <HeaderMappingStep
            headers={state.originalHeaders}
            data={state.data}
            onMap={handleHeaderMapping}
            isPending={isPending}
          />
        )
      case 3:
        return (
          <GeocodingStep
            data={state.processedData}
            onNext={handleSchemeCoding}
            isPending={isPending}
            onAmendmentApplied={handleAmendmentApplied}
          />
        )
      case 4:
        return (
          <OccConstCodingStep
            data={state.processedData}
            onNext={handleOtherModifiers}
            isPending={isPending}
            onAmendmentApplied={handleAmendmentApplied}
          />
        )
      case 5:
        return (
          <OtherModifiersStep
            data={state.processedData}
            onNext={handleCatnetModifiers}
            isPending={isPending}
            onAmendmentApplied={handleAmendmentApplied}
          />
        )
      case 6:
        return (
          <CatnetModifiersStep6
            data={state.processedData}
            onNext={handleCatnetModifiers2}
            isPending={isPending}
            onAmendmentApplied={handleAmendmentApplied}
          />
        )
      case 7:
        return (
          <CatnetModifiersStep
            data={state.processedData}
            onNext={handleExposure}
            isPending={isPending}
            onAmendmentApplied={handleAmendmentApplied}
          />
        )
      case 8:
        return (
          <ExposureStep
            data={state.processedData}
            onNext={handleHazardAnalysis}
            isPending={isPending}
            onAmendmentApplied={handleAmendmentApplied}
          />
        )
      case 9:
        return <HazardAnalysisStep data={state.processedData} onNext={handleDataSummary} isPending={isPending} />
      case 10:
        return <DataSummaryStep data={state.processedData} onNext={handleGenerateOutput} isPending={isPending} />
      case 11:
        const originalMappedHeaders = Object.values(state.fieldMapping)
        const additionalHeaders = originalMappedHeaders.filter((h) => !OUTPUT_COLUMN_SEQUENCE.includes(h))
        const finalHeaders = [...OUTPUT_COLUMN_SEQUENCE, ...additionalHeaders]
        return <GenerateOutputStep data={state.processedData} csvData={state.outputCsv} finalHeaders={finalHeaders} />
      default:
        return null
    }
  }

  const isWorkflowComplete = state.currentStep > steps.length

  return (
    <div className="min-h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <div className="p-6 space-y-6">
          <header className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{"CATCQRE AI"}</h1>
              <p className="text-muted-foreground">Intelligent Data Cleansing with Autonomous AI</p>
            </div>
            {state.currentStep > 1 && (
              <Button variant="outline" onClick={resetState} className="mt-4 md:mt-0 bg-transparent">
                Start Over
              </Button>
            )}
          </header>

          <AgentStatusIndicator
            status={agentStatus}
            currentAction={currentAgentAction}
            progress={((state.currentStep - 1) / (steps.length - 1)) * 100}
            confidence={agentConfidence}
            lastDecision={lastAgentDecision}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="business-rules">
                <Settings className="w-4 h-4 mr-2" />
                Business Rules
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <BarChart2 className="w-4 h-4 mr-2" />
                Analysis
              </TabsTrigger>
              <TabsTrigger value="learning">
                <BrainCircuit className="w-4 h-4 mr-2" />
                Learning
              </TabsTrigger>
            </TabsList>

            <TabsContent value="business-rules">
              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">Configure Business Rules</h2>
                <p className="text-muted-foreground mb-6">
                  Adjust validation thresholds and default values for data processing.
                </p>
                <BusinessRulesStep
                  businessRules={state.businessRules}
                  onRulesUpdate={(rules) => setState((prev) => ({ ...prev, businessRules: rules }))}
                  onNext={handleBusinessRules}
                  isPending={isPending}
                />
              </div>
            </TabsContent>

            <TabsContent value="workflow">
              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                {isWorkflowComplete ? (
                  <div className="text-center p-8">
                    <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">Processing Complete!</h2>
                    <p className="text-muted-foreground mb-6">
                      Your file has been processed with AI assistance. View the results in the Analysis tab.
                    </p>
                    <Button onClick={() => setActiveTab("analysis")}>Go to Analysis</Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-base font-medium text-primary">
                          Step {state.currentStep}: {steps.find((s) => s.id === state.currentStep)?.name}
                        </span>
                        <span className="text-sm font-medium text-primary">
                          {Math.round(((state.currentStep - 1) / (steps.length - 1)) * 100)}%
                        </span>
                      </div>
                      <Progress value={((state.currentStep - 1) / (steps.length - 1)) * 100} className="w-full" />
                    </div>

                    {state.currentStep > 1 && !isWorkflowComplete && (
                      <div className="mb-4">
                        <Button variant="outline" onClick={handleBackStep} disabled={isPending}>
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Previous Step
                        </Button>
                      </div>
                    )}

                    {state.error && (
                      <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{state.error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="mt-6 min-h-[400px] flex items-center justify-center">{renderStepContent()}</div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analysis">
              <div className="w-full">
                <SpatialAnalysisDashboard currentPortfolio={state.processedData} />
              </div>
            </TabsContent>
            <TabsContent value="learning">
              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <h2 className="text-2xl font-bold text-foreground">Train CatScrub AI</h2>
                <p className="text-muted-foreground mt-2 mb-6">
                  Upload a corrected output file to teach the AI system. This will update the geocoding cache with the
                  correct coordinates from your file.
                </p>
                <FileUploadStep onFileUpload={handleLearnFromFile} isPending={isPending} />
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-semibold text-foreground">Manage Cache</h3>
                  <p className="text-muted-foreground mt-1 mb-4">
                    Your browser has cached {Object.keys(geocodingCache).length} geocoding results.
                  </p>
                  <Button variant="destructive" onClick={handleClearCache}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Learned Data
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <PopupAIAssistant
        onAgentAction={handleAgentAction}
        currentStep={state.currentStep}
        processingStatus={agentStatus}
      />
    </div>
  )
}

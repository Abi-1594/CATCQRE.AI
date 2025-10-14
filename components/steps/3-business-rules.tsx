"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Target, DollarSign } from "lucide-react"
import type { BusinessRules } from "@/lib/types"
import { accountSelectionOccupancies } from "@/lib/occupancy-account-selection"

interface BusinessRulesStepProps {
  businessRules: BusinessRules
  onRulesUpdate: (rules: BusinessRules) => void
  onNext: () => void
  isPending: boolean
}

export default function BusinessRulesStep({ businessRules, onRulesUpdate, onNext, isPending }: BusinessRulesStepProps) {
  const [rules, setRules] = useState<BusinessRules>(businessRules || defaultBusinessRules)

  const handleRuleChange = (key: keyof BusinessRules, value: any) => {
    const updatedRules = { ...rules, [key]: value }
    setRules(updatedRules)
    onRulesUpdate(updatedRules)
  }

  const handleNext = () => {
    onRulesUpdate(rules)
    onNext()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
      value,
    )
  }

  const getSelectedOccupancyDescription = () => {
    const selected = accountSelectionOccupancies.find((occ) => occ.code === rules.defaultOccupancyForMisc)
    return selected ? selected.description : ""
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Configure Business Rules</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Set validation rules and confidence thresholds for data processing
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Default Occupancy Selection */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Default Occupancy Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-sm font-medium">Default Occupancy for Misc/Vacant/Blank</Label>
              <Select
                value={rules.defaultOccupancyForMisc}
                onValueChange={(value) => handleRuleChange("defaultOccupancyForMisc", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountSelectionOccupancies.map((occ) => (
                    <SelectItem key={occ.code} value={occ.code}>
                      {occ.scheme} {occ.code} - {occ.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Selected: {getSelectedOccupancyDescription()}</p>
              <p className="text-xs text-gray-500 mt-1">
                Applied to occupancies containing: misc, miscellaneous, vacant, blank, empty, unknown, other, n/a, tbd
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Confidence Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Confidence Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">
                Occupancy Confidence Threshold: {Math.round(rules.occupancyConfidenceThreshold * 100)}%
              </Label>
              <Slider
                value={[rules.occupancyConfidenceThreshold]}
                onValueChange={([value]) => handleRuleChange("occupancyConfidenceThreshold", value)}
                max={1}
                min={0}
                step={0.05}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">Records below this threshold will be flagged for review</p>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Construction Confidence Threshold: {Math.round(rules.constructionConfidenceThreshold * 100)}%
              </Label>
              <Slider
                value={[rules.constructionConfidenceThreshold]}
                onValueChange={([value]) => handleRuleChange("constructionConfidenceThreshold", value)}
                max={1}
                min={0}
                step={0.05}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">Records below this threshold will be flagged for review</p>
            </div>
          </CardContent>
        </Card>

        {/* Building Validation Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Building Validation Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stories Validation */}
            <div>
              <Label className="text-sm font-medium">Max Stories Threshold</Label>
              <Input
                type="number"
                value={rules.maxStoriesThreshold}
                onChange={(e) => handleRuleChange("maxStoriesThreshold", Number.parseInt(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Automatically checks for wood construction when stories exceed this threshold
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Action when wood construction + stories exceeded</Label>
              <Select
                value={rules.storiesExceededAction}
                onValueChange={(value) => handleRuleChange("storiesExceededAction", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No action</SelectItem>
                  <SelectItem value="reset_construction">Reset construction to Unknown (0)</SelectItem>
                  <SelectItem value="reset_stories">Reset stories to 0</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Year Built Validation */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-sm font-medium">Min Year Built</Label>
                <Input
                  type="number"
                  value={rules.minYearBuilt}
                  onChange={(e) => handleRuleChange("minYearBuilt", Number.parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Max Year Built</Label>
                <Input
                  type="number"
                  value={rules.maxYearBuilt}
                  onChange={(e) => handleRuleChange("maxYearBuilt", Number.parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Invalid year action</Label>
              <Select
                value={rules.invalidYearAction}
                onValueChange={(value) => handleRuleChange("invalidYearAction", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No action</SelectItem>
                  <SelectItem value="reset_year">Reset to 0</SelectItem>
                  <SelectItem value="set_default">Set to default year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {rules.invalidYearAction === "set_default" && (
              <div>
                <Label className="text-sm font-medium">Default Year Built</Label>
                <Input
                  type="number"
                  value={rules.defaultYearBuilt}
                  onChange={(e) => handleRuleChange("defaultYearBuilt", Number.parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            )}

            <Separator />

            {/* Square Footage Rules */}
            <div>
              <Label className="text-sm font-medium">Min Square Footage</Label>
              <Input
                type="number"
                value={rules.minSquareFootage}
                onChange={(e) => handleRuleChange("minSquareFootage", Number.parseInt(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum acceptable square footage</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Invalid square footage action</Label>
              <Select
                value={rules.invalidSqftAction}
                onValueChange={(value) => handleRuleChange("invalidSqftAction", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No action</SelectItem>
                  <SelectItem value="reset_sqft">Reset to 0</SelectItem>
                  <SelectItem value="set_default">Set to default</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {rules.invalidSqftAction === "set_default" && (
              <div>
                <Label className="text-sm font-medium">Default Square Footage</Label>
                <Input
                  type="number"
                  value={rules.defaultSquareFootage}
                  onChange={(e) => handleRuleChange("defaultSquareFootage", Number.parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Value Validation Rules */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Value Validation Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Max Building Value</Label>
              <Input
                type="number"
                value={rules.maxBuildingValue}
                onChange={(e) => handleRuleChange("maxBuildingValue", Number.parseInt(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(rules.maxBuildingValue)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Max Contents Value</Label>
              <Input
                type="number"
                value={rules.maxContentsValue}
                onChange={(e) => handleRuleChange("maxContentsValue", Number.parseInt(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(rules.maxContentsValue)}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Max Business Interruption Value</Label>
              <Input
                type="number"
                value={rules.maxBIValue}
                onChange={(e) => handleRuleChange("maxBIValue", Number.parseInt(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(rules.maxBIValue)}</p>
            </div>

            <div className="md:col-span-3">
              <Label className="text-sm font-medium">Invalid value action</Label>
              <Select
                value={rules.invalidValueAction}
                onValueChange={(value) => handleRuleChange("invalidValueAction", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No action</SelectItem>
                  <SelectItem value="reset_value">Reset to 0</SelectItem>
                  <SelectItem value="flag_review">Flag for review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Button onClick={handleNext} disabled={isPending} className="w-full sm:w-auto px-8">
          {isPending ? "Processing..." : "Apply Rules & Continue to Geocoding"}
        </Button>
      </div>
    </div>
  )
}

const defaultBusinessRules: BusinessRules = {
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
  defaultOccupancyForMisc: "37", // Default to General Commercial
}

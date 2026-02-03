/**
 * App.tsx - Main Application Component
 *
 * Integrates all UI components with the conversion orchestrator
 * for Mockto - HTML Mockup to React Converter.
 */

import { useState, useCallback, useEffect } from 'react';
import { AlertCircle, Download, FileText, Loader2, Settings2, X } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FileUpload } from '@/components/input/FileUpload';
import { HtmlInput } from '@/components/input/HtmlInput';
import { CodePreview } from '@/components/output/CodePreview';
import { OutputControls } from '@/components/output/OutputControls';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { getConverterOrchestrator } from '@/lib/orchestrator';
import { getSettingsStore } from '@/lib/storage/settingsStore';
import type { ConversionResult } from '@/types/orchestrator.types';
import type { ConverterSettings } from '@/types/ui.types';
import { OutputFormat } from '@/types/generator.types';
import { CssStrategy } from '@/types/css.types';

interface ConversionState {
  isConverting: boolean;
  result: ConversionResult | null;
  error: string | null;
  currentStage: string;
  progress: number;
}

function App() {
  // Settings state
  const [settings, setSettings] = useState<ConverterSettings>({
    typescript: true,
    cssFramework: 'tailwind',
    componentStyle: 'functional',
    inlineStyles: false,
    extractAssets: true,
    namingConvention: 'pascal-case',
    outputPath: './src/components',
  });

  const [showSettings, setShowSettings] = useState(false);

  // HTML input state
  const [htmlInput, setHtmlInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Conversion state
  const [conversionState, setConversionState] = useState<ConversionState>({
    isConverting: false,
    result: null,
    error: null,
    currentStage: '',
    progress: 0,
  });

  // Get orchestrator and settings store
  const orchestrator = getConverterOrchestrator();
  const settingsStore = getSettingsStore();

  // Load settings on mount
  useEffect(() => {
    const storedSettings = settingsStore.loadSettings();
    // Convert AppSettings to ConverterSettings format
    setSettings({
      typescript: storedSettings.component.outputFormat === OutputFormat.TSX,
      cssFramework: mapCssStrategyToOption(storedSettings.css.strategy) as 'tailwind' | 'css-modules' | 'vanilla',
      componentStyle: storedSettings.component.componentStyle ?? 'functional',
      inlineStyles: !storedSettings.component.extractStyles,
      extractAssets: storedSettings.advanced.extractAssets ?? true,
      namingConvention: storedSettings.component.namingConvention ?? 'pascal-case',
      outputPath: storedSettings.ui.outputPath ?? './src/components',
    });
  }, []);

  // Map CssStrategy to CssFrameworkOption
  const mapCssStrategyToOption = (strategy: CssStrategy): string => {
    switch (strategy) {
      case CssStrategy.TAILWIND:
        return 'tailwind';
      case CssStrategy.CSS_MODULES:
        return 'css-modules';
      case CssStrategy.VANILLA:
        return 'vanilla';
      default:
        return 'tailwind';
    }
  };

  // Map CssFrameworkOption to CssStrategy
  const mapOptionToCssStrategy = (option: string): CssStrategy => {
    switch (option) {
      case 'tailwind':
        return CssStrategy.TAILWIND;
      case 'css-modules':
        return CssStrategy.CSS_MODULES;
      case 'vanilla':
        return CssStrategy.VANILLA;
      case 'styled-components':
        return CssStrategy.TAILWIND; // Default fallback
      case 'emotion':
        return CssStrategy.TAILWIND; // Default fallback
      default:
        return CssStrategy.TAILWIND;
    }
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      setHtmlInput(content);
      setUploadedFile(file);
      setConversionState((prev) => ({
        ...prev,
        result: null,
        error: null,
      }));
    } catch (error) {
      setConversionState({
        isConverting: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to read file',
        currentStage: '',
        progress: 0,
      });
    }
  }, []);

  // Handle conversion
  const handleConvert = useCallback(async () => {
    if (!htmlInput.trim()) {
      setConversionState({
        isConverting: false,
        result: null,
        error: 'Please enter HTML code or upload a file',
        currentStage: '',
        progress: 0,
      });
      return;
    }

    setConversionState({
      isConverting: true,
      result: null,
      error: null,
      currentStage: 'parse',
      progress: 10,
    });

    try {
      const result = await orchestrator.convert(htmlInput, {
        componentName: 'Component',
        outputFormat: settings.typescript ? OutputFormat.TSX : OutputFormat.JSX,
        cssStrategy: mapOptionToCssStrategy(settings.cssFramework),
        extractStyles: !settings.inlineStyles,
        convertClassToClassName: true,
      });

      if (result.success) {
        setConversionState({
          isConverting: false,
          result,
          error: null,
          currentStage: 'complete',
          progress: 100,
        });
      } else {
        setConversionState({
          isConverting: false,
          result: null,
          error: result.error || 'Conversion failed',
          currentStage: '',
          progress: 0,
        });
      }
    } catch (error) {
      setConversionState({
        isConverting: false,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        currentStage: '',
        progress: 0,
      });
    }
  }, [htmlInput, settings, orchestrator]);

  // Handle download
  const handleDownload = useCallback(async (format: 'tsx' | 'jsx' | 'zip') => {
    if (!conversionState.result?.zipBlob) return;

    try {
      const url = URL.createObjectURL(conversionState.result.zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `react-components.${format === 'zip' ? 'zip' : format === 'tsx' ? 'tsx' : 'jsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [conversionState.result]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!conversionState.result?.files.length) return;

    const mainFile = conversionState.result.files.find(f =>
      f.fileName.endsWith('.tsx') || f.fileName.endsWith('.jsx')
    );
    if (mainFile) {
      await navigator.clipboard.writeText(mainFile.content);
    }
  }, [conversionState.result]);

  // Handle clear
  const handleClear = useCallback(() => {
    setHtmlInput('');
    setUploadedFile(null);
    setConversionState({
      isConverting: false,
      result: null,
      error: null,
      currentStage: '',
      progress: 0,
    });
  }, []);

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings: ConverterSettings) => {
    setSettings(newSettings);

    // Persist to localStorage - save ALL settings
    settingsStore.updateSettings({
      component: {
        outputFormat: newSettings.typescript ? OutputFormat.TSX : OutputFormat.JSX,
        includePropTypes: newSettings.typescript,
        extractStyles: !newSettings.inlineStyles,
        includeReactImport: true,
        convertClassToClassName: true,
        componentNameTemplate: '{{tag}} {{className}}',
        generateIndexFiles: false,
        componentStyle: newSettings.componentStyle,
        namingConvention: newSettings.namingConvention,
      },
      css: {
        strategy: mapOptionToCssStrategy(newSettings.cssFramework),
        preserveInline: newSettings.inlineStyles,
        extractToSeparateFile: true,
        classPrefix: '',
        useCssVariables: false,
        minClassNameLength: 3,
        optimize: false,
        targetFilename: 'styles',
      },
      advanced: {
        enableComponentSplitting: false,
        maxFileSizeKB: 100,
        enableSemanticAnalysis: false,
        enablePatternDetection: false,
        customTransformations: {},
        extractAssets: newSettings.extractAssets,
      },
      ui: {
        theme: 'auto' as const,
        editorFontSize: 14,
        editorTabSize: 2,
        showLineNumbers: true,
        enableWordWrap: true,
        previewPosition: 'right' as const,
        outputPath: newSettings.outputPath,
      },
      formatting: {
        indentStyle: 'spaces',
        indentSize: 2,
        printWidth: 80,
        singleQuote: true,
        trailingComma: 'es5',
        semi: true,
        prettier: true,
      },
    });

    // Also update the orchestrator settings
    orchestrator.updateSettings({
      component: {
        outputFormat: newSettings.typescript ? OutputFormat.TSX : OutputFormat.JSX,
        includePropTypes: newSettings.typescript,
        extractStyles: !newSettings.inlineStyles,
        includeReactImport: true,
        convertClassToClassName: true,
        componentNameTemplate: '{{tag}} {{className}}',
        generateIndexFiles: false,
        componentStyle: newSettings.componentStyle,
        namingConvention: newSettings.namingConvention,
      },
      css: {
        strategy: mapOptionToCssStrategy(newSettings.cssFramework),
        preserveInline: newSettings.inlineStyles,
        extractToSeparateFile: true,
        classPrefix: '',
        useCssVariables: false,
        minClassNameLength: 3,
        optimize: false,
        targetFilename: 'styles',
      },
    });
  }, [settingsStore]);

  // Get current output code for preview
  const getOutputCode = useCallback((): { code: string; filename: string } => {
    if (conversionState.result?.files.length) {
      const mainFile = conversionState.result.files.find(f =>
        f.fileName.endsWith('.tsx') || f.fileName.endsWith('.jsx')
      );
      if (mainFile) {
        return {
          code: mainFile.content,
          filename: mainFile.fileName,
        };
      }
    }
    return {
      code: '',
      filename: settings.typescript ? 'Component.tsx' : 'Component.jsx',
    };
  }, [conversionState.result, settings.typescript]);

  const outputCode = getOutputCode();

  // Get stage label
  const getStageLabel = (stage: string): string => {
    const labels: Record<string, string> = {
      parse: 'Parsing HTML...',
      split: 'Splitting components...',
      generate: 'Generating React code...',
      css: 'Converting CSS...',
      assets: 'Extracting assets...',
      zip: 'Creating ZIP archive...',
      complete: 'Complete!',
    };
    return labels[stage] || stage;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <Header
        title="Mockto"
        subtitle="HTML Mockup to React Converter"
        version="0.1.0"
        showNavigation={false}
        showThemeToggle={true}
        showGitHubLink={true}
        githubUrl="https://github.com/dgtise25/mockto"
        showSearch={false}
        onSettingsClick={() => setShowSettings(!showSettings)}
        sticky
      />

      {/* Main Content */}
      <main id="main-content" className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Error Alert */}
          {conversionState.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{conversionState.error}</AlertDescription>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={() => setConversionState((prev) => ({ ...prev, error: null }))}
              >
                <X className="h-4 w-4" />
              </Button>
            </Alert>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Settings</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SettingsPanel
                settings={settings}
                onChange={handleSettingsChange}
                showShortcuts={true}
              />
            </Card>
          )}

          {/* Main Converter Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Input */}
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Input</h2>
                  {!showSettings && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSettings(true)}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                    <TabsTrigger value="paste">Paste HTML</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-4">
                    <FileUpload
                      onFileUpload={handleFileUpload}
                      accept=".html,.htm"
                      maxSize={1024 * 1024} // 1MB
                      disabled={conversionState.isConverting}
                    />
                  </TabsContent>

                  <TabsContent value="paste" className="mt-4">
                    <HtmlInput
                      value={htmlInput}
                      onChange={setHtmlInput}
                      label="HTML Code"
                      placeholder="<div>Your HTML here...</div>"
                      minRows={10}
                      maxRows={25}
                      showLineNumbers={true}
                      readOnly={conversionState.isConverting}
                      showClearButton={true}
                    />
                  </TabsContent>
                </Tabs>

                {/* Convert Button */}
                <div className="mt-6">
                  <Button
                    type="button"
                    onClick={handleConvert}
                    disabled={conversionState.isConverting || !htmlInput.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {conversionState.isConverting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Convert to React
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress */}
                {conversionState.isConverting && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{getStageLabel(conversionState.currentStage)}</span>
                      <span>{conversionState.progress}%</span>
                    </div>
                    <Progress value={conversionState.progress} className="w-full" />
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column - Output */}
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Output</h2>
                  {conversionState.result && (
                    <div className="text-sm text-muted-foreground">
                      {conversionState.result.stats.totalComponents} component
                      {conversionState.result.stats.totalComponents !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                <CodePreview
                  code={outputCode.code}
                  filename={outputCode.filename}
                  language={settings.typescript ? 'tsx' : 'jsx'}
                  lineNumbers={true}
                  loading={conversionState.isConverting}
                />

                {/* Output Controls */}
                <div className="mt-4">
                  <OutputControls
                    code={outputCode.code}
                    filename={outputCode.filename}
                    onDownload={handleDownload}
                    onCopy={handleCopy}
                    onClear={handleClear}
                    hasOutput={!!conversionState.result}
                  />
                </div>
              </Card>

              {/* Conversion Stats */}
              {conversionState.result && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Conversion Statistics</h3>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Processing Time</dt>
                      <dd className="font-mono">
                        {(conversionState.result.stats.processingTime / 1000).toFixed(2)}s
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Files Generated</dt>
                      <dd className="font-mono">{conversionState.result.stats.totalFiles}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Components</dt>
                      <dd className="font-mono">{conversionState.result.stats.totalComponents}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Assets</dt>
                      <dd className="font-mono">{conversionState.result.stats.totalAssets}</dd>
                    </div>
                  </dl>

                  {/* Pipeline Stages */}
                  {conversionState.result.stages.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-sm mb-3">Pipeline</h4>
                      <div className="space-y-2">
                        {conversionState.result.stages.map((stage, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{stage.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {(stage.duration / 1000).toFixed(2)}s
                              </span>
                              {stage.status === 'complete' && (
                                <span className="text-green-500">✓</span>
                              )}
                              {stage.status === 'error' && (
                                <span className="text-destructive">✗</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>

          {/* File Info */}
          {uploadedFile && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer
        appName="Mockto"
        version="0.1.0"
        showVersion={true}
        showLinks={true}
        showBackToTop={true}
        license="MIT"
        links={{
          documentation: '/docs',
          github: 'https://github.com/dgtise25/mockto',
          about: '/about',
        }}
      />
    </div>
  );
}

export default App;

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileJson, FileSpreadsheet, Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface ImportReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportReviewsModal({ open, onOpenChange }: ImportReviewsModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [marketplace, setMarketplace] = useState<string>("");
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async ({ file, marketplace }: { file: File; marketplace: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('marketplace', marketplace);

      const response = await fetch('/api/reviews/import-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import reviews');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.imported} reviews${data.skipped > 0 ? ` (${data.skipped} skipped)` : ''}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/imported'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/tracked'] });
      onOpenChange(false);
      setSelectedFile(null);
      setMarketplace("");
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import.",
        variant: "destructive",
      });
      return;
    }

    if (!marketplace) {
      toast({
        title: "Marketplace Required",
        description: "Please select the marketplace for these reviews.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Import Started",
      description: `Processing reviews from ${selectedFile.name}... This may take a few moments.`,
    });

    importMutation.mutate({ file: selectedFile, marketplace });
  };

  const handleDownloadTemplate = () => {
    const csvContent = `Title,Content,Customer Name,Customer Email,Rating,Created At
"Sample Review Title","This is a sample review content","John Doe","john@example.com",5,2024-01-15
"Another Review","Great product!","Jane Smith","jane@example.com",4,2024-01-14`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'review_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded successfully.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="modal-import-reviews">
        <DialogHeader>
          <DialogTitle>Import Reviews</DialogTitle>
          <DialogDescription>
            Upload a CSV or JSON file containing customer reviews. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Download Template</Label>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleDownloadTemplate}
              data-testid="button-download-template"
            >
              <Download className="h-4 w-4" />
              Download CSV Template
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="marketplace">Marketplace</Label>
            <Select value={marketplace} onValueChange={setMarketplace}>
              <SelectTrigger data-testid="select-marketplace">
                <SelectValue placeholder="Select marketplace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Amazon">Amazon</SelectItem>
                <SelectItem value="Shopify">Shopify</SelectItem>
                <SelectItem value="Walmart">Walmart</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload File</Label>
            <div className="border-2 border-dashed rounded-md p-6 text-center hover-elevate">
              <input
                id="file"
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="hidden"
                data-testid="input-file-upload"
              />
              <label
                htmlFor="file"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {selectedFile ? (
                  <>
                    {selectedFile.name.endsWith('.json') ? (
                      <FileJson className="h-12 w-12 text-muted-foreground" />
                    ) : (
                      <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                    )}
                    <div className="text-sm font-medium">{selectedFile.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div className="text-sm font-medium">Click to upload or drag and drop</div>
                    <div className="text-xs text-muted-foreground">CSV or JSON (MAX. 10MB)</div>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-import"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || !marketplace || importMutation.isPending}
            data-testid="button-start-import"
          >
            <Upload className="h-4 w-4 mr-2" />
            {importMutation.isPending ? "Importing..." : "Import Reviews"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

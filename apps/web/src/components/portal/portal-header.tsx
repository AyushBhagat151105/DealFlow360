import React from "react";
import { Zap, Lock, CheckCircle2, Clock, FileText, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PortalHeaderProps = {
  isConfirmed: boolean;
  isUnderNegotiation: boolean;
  onOpenConfirmModal: () => void;
  onOpenSendLinkModal: () => void;
};

export function PortalHeader({
  isConfirmed,
  isUnderNegotiation,
  onOpenConfirmModal,
  onOpenSendLinkModal,
}: PortalHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-8 py-3.5 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-sm">
            <Zap className="h-5 w-5 fill-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-foreground">
                DealFlow<span className="text-emerald-500">360</span>
              </span>
              <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0 border-emerald-500/40 text-emerald-500">
                Client Portal
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
              <Lock className="h-3 w-3 text-emerald-500" /> 256-bit Encrypted Session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge
            variant={isConfirmed ? "default" : isUnderNegotiation ? "secondary" : "outline"}
            className={`text-xs px-2.5 py-1 gap-1.5 font-medium ${
              isConfirmed
                ? "bg-emerald-600 text-white"
                : isUnderNegotiation
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : ""
            }`}
          >
            {isConfirmed ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Quotation Confirmed</span>
              </>
            ) : isUnderNegotiation ? (
              <>
                <Clock className="h-3.5 w-3.5" />
                <span>Negotiation In Progress</span>
              </>
            ) : (
              <>
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Ready for Review</span>
              </>
            )}
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSendLinkModal}
            className="text-xs h-9 gap-1.5"
            title="Dispatch portal link to recipient email"
          >
            <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Share Link</span>
          </Button>

          {!isConfirmed && (
            <Button
              onClick={onOpenConfirmModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm & Sign Quotation</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

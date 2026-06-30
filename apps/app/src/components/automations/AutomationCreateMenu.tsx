import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  COARSE_POINTER_COMPACT_ROW_HEIGHT_CLASS,
  COARSE_POINTER_ICON_SIZE_CLASS,
} from "@/components/ui/coarse-pointer-sizing";
import { Icon } from "@/components/ui/icon";
import { CREATE_LOOP_PROMPT } from "@/components/promptbox/PromptBoxActionsMenu";
import { getRootComposeRoutePath } from "@/lib/route-paths";
import { CreateAutomationDialog } from "./CreateAutomationDialog";

export interface AutomationCreateMenuProps {
  defaultProjectId?: string;
}

export function AutomationCreateMenu({
  defaultProjectId,
}: AutomationCreateMenuProps) {
  const navigate = useNavigate();
  const [manualDialogOpen, setManualDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={COARSE_POINTER_COMPACT_ROW_HEIGHT_CLASS}
          >
            <Icon name="Plus" className={COARSE_POINTER_ICON_SIZE_CLASS} />
            Create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56"
          mobileTitle="Create automation"
        >
          <DropdownMenuItem
            onSelect={() => {
              navigate(getRootComposeRoutePath(), {
                state: {
                  focusPrompt: true,
                  initialPrompt: CREATE_LOOP_PROMPT,
                },
              });
            }}
          >
            <Icon
              name="MessageSquarePlus"
              className={COARSE_POINTER_ICON_SIZE_CLASS}
            />
            <span>Create via chat</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setManualDialogOpen(true)}>
            <Icon name="Edit" className={COARSE_POINTER_ICON_SIZE_CLASS} />
            <span>Create manually</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateAutomationDialog
        open={manualDialogOpen}
        onOpenChange={setManualDialogOpen}
        defaultProjectId={defaultProjectId}
      />
    </>
  );
}

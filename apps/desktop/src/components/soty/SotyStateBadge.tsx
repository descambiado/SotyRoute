import StatusBadge from "../StatusBadge";
import type { SotyState } from "../../types/sotyScore";
import { sotyStateToVariant, sotyStateToLabel } from "../../lib/sotyPresenter";

interface Props {
  state: SotyState;
}

/**
 * Renders a StatusBadge styled for the current SotyState.
 * Maps SOTY_* states to ok/warn/danger/info/idle badge variants.
 */
export default function SotyStateBadge({ state }: Props) {
  return (
    <StatusBadge variant={sotyStateToVariant(state)}>
      {sotyStateToLabel(state)}
    </StatusBadge>
  );
}

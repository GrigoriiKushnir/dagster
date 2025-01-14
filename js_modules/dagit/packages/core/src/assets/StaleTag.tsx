import {Colors, Box, BaseTag} from '@dagster-io/ui';
import React from 'react';

import {LiveDataForNode} from '../asset-graph/Utils';

export const isAssetMissing = (liveData?: LiveDataForNode) =>
  liveData && liveData.currentLogicalVersion === null;

/* Note: 
- `projectedLogicalVersion` is null for partitioned assets
- `currentLogicalVersion` is null for assets that have never materialized
- `currentLogicalVersion` is INITIAL for source assets that have never been
  observed and for assets materialized before the launch of this feature (edited) 
*/
export const isAssetStale = (liveData?: LiveDataForNode) =>
  liveData &&
  liveData.projectedLogicalVersion &&
  liveData.currentLogicalVersion !== null &&
  liveData.currentLogicalVersion !== 'INITIAL' &&
  liveData.currentLogicalVersion !== liveData.projectedLogicalVersion;

export const StaleTag: React.FC<{liveData?: LiveDataForNode; onClick?: () => void}> = ({
  liveData,
  onClick,
}) =>
  isAssetStale(liveData) ? (
    <Box onClick={onClick}>
      <BaseTag
        fillColor={Colors.Yellow50}
        textColor={Colors.Yellow700}
        label="Stale"
        interactive={!!onClick}
      />
    </Box>
  ) : null;

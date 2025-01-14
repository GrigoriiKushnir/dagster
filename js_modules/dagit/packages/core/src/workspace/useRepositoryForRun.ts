import * as React from 'react';

import {RunFragmentForRepositoryMatchFragment} from '../graphql/graphql';

import {DagsterRepoOption, useRepositoryOptions} from './WorkspaceContext';
import {findRepoContainingPipeline, repoContainsPipeline} from './findRepoContainingPipeline';

type MatchType = {
  match: DagsterRepoOption;
  type: 'origin-and-snapshot' | 'origin-only' | 'snapshot-only' | 'pipeline-name-only';
};

/**
 * Given a Run fragment, find the repository that contains its pipeline.
 */
export const useRepositoryForRun = (
  run: RunFragmentForRepositoryMatchFragment | null | undefined,
): MatchType | null => {
  const {options} = useRepositoryOptions();

  const repoMatch = React.useMemo(() => {
    if (!run) {
      return null;
    }

    const pipelineName = run.pipelineName;
    // Try to match the pipeline name within the specified origin, if possible.
    const origin = run.repositoryOrigin;

    if (!origin) {
      return null;
    }

    const location = origin?.repositoryLocationName;
    const name = origin?.repositoryName;

    const match = options.find(
      (option) => option.repository.name === name && option.repositoryLocation.name === location,
    );

    // The origin repo is loaded. Verify that a pipeline with this name exists and return the match if so.
    return match && repoContainsPipeline(match, pipelineName) ? match : null;
  }, [options, run]);

  const snapshotMatches = React.useMemo(() => {
    if (!run) {
      return null;
    }

    const pipelineName = run.pipelineName;
    // When jobs are subsetted (with an opSelection or assetSelection), only their
    // parentPipelineSnapshotId (the id of the pipelineSnapshot that they were subsetted from) will
    // be found in the repository, so look for that instead.
    const snapshotId = run.parentPipelineSnapshotId ?? run.pipelineSnapshotId;

    // Find the repository that contains the specified pipeline name and snapshot ID, if any.
    if (pipelineName && snapshotId) {
      const snapshotMatches = findRepoContainingPipeline(options, pipelineName, snapshotId);
      if (snapshotMatches.length) {
        return snapshotMatches;
      }
    }

    return null;
  }, [options, run]);

  const pipelineNameMatches = React.useMemo(() => {
    if (!run) {
      return null;
    }

    const pipelineName = run.pipelineName;

    // There is no origin repo. Find any repos that might contain a matching pipeline name.
    const possibleMatches = findRepoContainingPipeline(options, pipelineName);
    return possibleMatches.length ? possibleMatches : null;
  }, [options, run]);

  if (repoMatch) {
    if (snapshotMatches) {
      const repoAndSnapshotMatch = snapshotMatches.find(
        (repoOption) =>
          repoOption.repository.name === repoMatch.repository.name &&
          repoOption.repositoryLocation.name === repoMatch.repositoryLocation.name,
      );
      if (repoAndSnapshotMatch) {
        return {match: repoAndSnapshotMatch, type: 'origin-and-snapshot'};
      }
    }

    return {match: repoMatch, type: 'origin-only'};
  }

  if (snapshotMatches) {
    return {match: snapshotMatches[0], type: 'snapshot-only'};
  }

  if (pipelineNameMatches) {
    return {match: pipelineNameMatches[0], type: 'pipeline-name-only'};
  }

  return null;
};

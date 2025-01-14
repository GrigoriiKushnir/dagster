import * as React from 'react';

import {
  createSingleSession,
  IExecutionSession,
  IExecutionSessionChanges,
  useInitialDataForMode,
} from '../app/ExecutionSessionStorage';
import {
  LaunchpadSessionPartitionSetsFragmentFragment,
  LaunchpadSessionPipelineFragmentFragment,
} from '../graphql/graphql';
import {RepoAddress} from '../workspace/types';

import {LaunchpadType} from './LaunchpadRoot';
import LaunchpadSession from './LaunchpadSession';

interface Props {
  launchpadType: LaunchpadType;
  pipeline: LaunchpadSessionPipelineFragmentFragment;
  partitionSets: LaunchpadSessionPartitionSetsFragmentFragment;
  repoAddress: RepoAddress;
  sessionPresets: Partial<IExecutionSession>;
}

export const LaunchpadTransientSessionContainer = (props: Props) => {
  const {launchpadType, pipeline, partitionSets, repoAddress, sessionPresets} = props;

  const initialData = useInitialDataForMode(pipeline, partitionSets);
  const initialSessionComplete = createSingleSession({
    ...sessionPresets,
    runConfigYaml: initialData.runConfigYaml,
  });

  const [session, setSession] = React.useState<IExecutionSession>(initialSessionComplete);

  const onSaveSession = (changes: IExecutionSessionChanges) => {
    const newSession = {...session, ...changes};
    setSession(newSession);
  };

  return (
    <LaunchpadSession
      launchpadType={launchpadType}
      session={session}
      onSave={onSaveSession}
      pipeline={pipeline}
      partitionSets={partitionSets}
      repoAddress={repoAddress}
    />
  );
};

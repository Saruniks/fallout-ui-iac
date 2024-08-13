import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import * as actions from 'aws-cdk-lib/aws-codepipeline-actions'
import { RustSpaBuild } from 'rust-spa-build';
import { CloudFrontSpa } from 'cloud-front-spa';
import * as path from 'path';


export class FalloutUiIacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceOwner = 'Saruniks';
    const repo = 'fallout-ui'
    const branch = 'master'

    const source = codebuild.Source.gitHub({
      owner: sourceOwner,
      repo,
      branchOrRef: branch,
    });

    const rustSpaBuild = new RustSpaBuild(this, "RustSpaBuild", {
      source,
      buildSpec: codebuild.BuildSpec.fromAsset(path.join(__dirname, 'assets/buildspec.yml')),
    });

    const pipeline = new codepipeline.Pipeline(this, 'FalloutUiIacStackFrontendPipeline')

    const sourceOutput = new codepipeline.Artifact()

    pipeline.addStage({
      stageName: 'Source',
      actions: [new actions.GitHubSourceAction({
        actionName: 'Source-Action',
        output: sourceOutput,
        owner: sourceOwner,
        repo,
        branch,
        oauthToken: cdk.SecretValue.secretsManager('fallout-ui-github-key'),
      })]
    })

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        rustSpaBuild.getCodeBuildAction(sourceOutput),
      ]
    })

    const cloudFrontSpa = new CloudFrontSpa(this, 'FalloutUiIacCloudFrontStack', {
      tag: 'FalloutUiIac'
    });

    pipeline.addStage({
      stageName: 'DeployFalloutUi',
      actions: [
        new actions.S3DeployAction({
          actionName: 'S3_Deploy_Frontend_Artifacts',
          bucket: cloudFrontSpa.bucket,
          input: rustSpaBuild.buildOutput,
          extract: true,
        }),
      ]
    })
  }
}

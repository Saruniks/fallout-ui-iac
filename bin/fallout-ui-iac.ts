#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FalloutUiIacStack } from '../lib/fallout-ui-iac-stack';

const app = new cdk.App();

new FalloutUiIacStack(app, 'FalloutUiIacStack');

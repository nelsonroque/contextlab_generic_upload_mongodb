/// <reference types="react" />
import { Activity, ActivityKeyValueData, Session, ActivityType } from '@m2c2kit/core';
import * as SurveyReact from 'survey-react';

/**
 * The class for presenting surveys.
 *
 * @remarks There should not be any need to extend this class.
 *
 * @param surveyJson - The JSON survey definition, following the SurveyJS
 * specifications
 */
declare class Survey implements Activity {
    readonly type = ActivityType.Survey;
    private _session?;
    name: string;
    id: string;
    uuid: string;
    private _surveyJson?;
    beginTimestamp: number;
    beginIso8601Timestamp: string;
    private _survey?;
    private responseIndex;
    private confirmSkipping;
    private m2c2SurveyData;
    private confirmationSkipModal;
    constructor(surveyJson?: unknown);
    init(): void;
    /**
     * Sets the JSON survey definition, if it was not already set in
     * the constructor.
     *
     * @param surveyJson - The JSON survey definition, following the SurveyJS
     * specifications
     */
    setParameters(surveyJson: unknown): void;
    start(): void;
    stop(): void;
    private logConfigurationWarnings;
    private modifyDefaultSurveyJsConfiguration;
    private renderSurveyJs;
    ModalDialog: () => JSX.Element;
    SurveyComponent: () => JSX.Element;
    private addM2c2kitEventCallbacks;
    /**
     * Hooks into SurveyJS callbacks based on user interaction.
     *
     * @remarks SurveyJS has many callbacks, so there could be more functionalty
     * we could tap into.
     */
    private addSurveyJsEventCallbacks;
    private getConfirmationSkipText;
    private updateSurveyData;
    private calculateChangedM2c2SurveyData;
    private makeM2c2SurveyData;
    private makeNewDataObject;
    private makeDataObject;
    private getSkippedElementNamesOnPage;
    private makeDummiesFromMultipleResponse;
    private assignSelectedValuesToChoices;
    private makeAllDummiesNull;
    private addChoiceToVariableName;
    private IsSurveyJsVariableMultipleResponse;
    private getSurveyJsElementByName;
    private getCheckboxNoneChoiceName;
    private makeAutomaticSurveyDataProperties;
    callOnActivityResultsCallback(newData: ActivityKeyValueData, data: ActivityKeyValueData): void;
    private shouldShowSkipConfirmation;
    private nextPageIsAfterCurrentPage;
    private pageHasSkippedElements;
    /**
     * Returns the session that contains this survey.
     */
    get session(): Session;
    /**
     * Sets the session that contains this survey.
     */
    set session(session: Session);
    private get survey();
    private set survey(value);
    private initializeCustomWidgets;
    /**
     * Create SurveyReact.Model in a separate method so that it can be mocked
     * in testing.
     *
     * @param surveyJson
     * @returns
     */
    private createSurveyReactModel;
    /**
     * DO NOT USE THIS METHOD.
     *
     * @remarks For some reason, rollup-plugin-dts is dropping the
     * ActivityType enum. This is a workaround to get it back.
     *
     * @param __y
     */
    __x(__y: ActivityType): void;
}

/**
 * Survey element name and its value.
 *
 * @remarks This is not part of SurveyJs; this is to define the objects
 * returned in the variables array in data and newData
 */
interface SurveyVariable {
    name: string;
    value: any;
}

/**
 * Options object that is returned in SurveyJs onValueChanged event
 */
interface ValueChangedOptions {
    name: string;
    question: SurveyReact.Question;
    value: any;
}

/**
 * Options object that is returned in SurveyJs onCurrentPageChanging event
 */
interface CurrentPageChangingOptions {
    oldCurrentPage: SurveyReact.PageModel;
    newCurrentPage: SurveyReact.PageModel;
    allowChanging: boolean;
    isNextPage: boolean;
    isPrevPage: boolean;
}

/**
 * Options object that is returned in SurveyJs onCompleting event
 */
interface CompletingOptions {
    allowComplete: boolean;
    isCompleteOnTrigger: boolean;
}

export { CompletingOptions, CurrentPageChangingOptions, Survey, SurveyVariable, ValueChangedOptions };

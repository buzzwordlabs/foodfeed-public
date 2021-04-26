/*
** DON'T EDIT THIS FILE (unless you're working on Zapatos) **
It's part of Zapatos, and will be overwritten when the database schema is regenerated

Zapatos: https://jawj.github.io/zapatos/
Copyright (C) 2020 George MacKerron
Released under the MIT licence: see LICENCE file
*/

interface Error {
  code?: string;
}

/**
 * Check whether an error object matches any of a set of Postgres error types.
 * @param err The error to check
 * @param types The Postgres error types to check against
 */
export function isDatabaseError(
  err: Error,
  ...types: (keyof typeof pgErrors)[]
) {
  const { code } = err;
  if (!code || code.length !== 5) return false;
  return types.some((type) => code.startsWith(pgErrors[type]));
}

const pgErrors = {
  SuccessfulCompletion: '00',
  Warning: '01',
  NoData: '02',
  SqlStatementNotYetComplete: '03',
  ConnectionException: '08',
  TriggeredActionException: '09',
  FeatureNotSupported: '0A',
  InvalidTransactionInitiation: '0B',
  LocatorException: '0F',
  InvalidGrantor: '0L',
  InvalidRoleSpecification: '0P',
  DiagnosticsException: '0Z',
  CaseNotFound: '20',
  CardinalityViolation: '21',
  DataException: '22',
  IntegrityConstraintViolation: '23',
  InvalidCursorState: '24',
  InvalidTransactionState: '25',
  InvalidSqlStatementName: '26',
  TriggeredDataChangeViolation: '27',
  InvalidAuthorizationSpecification: '28',
  DependentPrivilegeDescriptorsStillExist: '2B',
  InvalidTransactionTermination: '2D',
  SqlRoutineException: '2F',
  InvalidCursorName: '34',
  ExternalRoutineException: '38',
  ExternalRoutineInvocationException: '39',
  SavepointException: '3B',
  InvalidCatalogName: '3D',
  InvalidSchemaName: '3F',
  TransactionRollback: '40',
  SyntaxErrorOrAccessRuleViolation: '42',
  WithCheckOptionViolation: '44',
  InsufficientResources: '53',
  DiskFull: '53',
  OutOfMemory: '53',
  TooManyConnections: '53',
  ConfigurationLimitExceeded: '53',
  ProgramLimitExceeded: '54',
  ObjectNotInPrerequisiteState: '55',
  OperatorIntervention: '57',
  SystemError: '58',
  SnapshotTooOld: '72',
  ConfigFileError: 'F0',
  FdwError: 'HV',
  PlpgsqlError: 'P0',
  InternalError: 'XX',
  // specific errors from here
  SuccessfulCompletion_SuccessfulCompletion: '00000',
  Warning_Warning: '01000',
  Warning_NullValueEliminatedInSetFunction: '01003',
  Warning_StringDataRightTruncation: '01004',
  Warning_PrivilegeNotRevoked: '01006',
  Warning_PrivilegeNotGranted: '01007',
  Warning_ImplicitZeroBitPadding: '01008',
  Warning_DynamicResultSetsReturned: '0100C',
  Warning_DeprecatedFeature: '01P01',
  NoData_NoData: '02000',
  NoData_NoAdditionalDynamicResultSetsReturned: '02001',
  SqlStatementNotYetComplete_SqlStatementNotYetComplete: '03000',
  ConnectionException_ConnectionException: '08000',
  ConnectionException_SqlclientUnableToEstablishSqlconnection: '08001',
  ConnectionException_ConnectionDoesNotExist: '08003',
  ConnectionException_SqlserverRejectedEstablishmentOfSqlconnection: '08004',
  ConnectionException_ConnectionFailure: '08006',
  ConnectionException_TransactionResolutionUnknown: '08007',
  ConnectionException_ProtocolViolation: '08P01',
  TriggeredActionException_TriggeredActionException: '09000',
  FeatureNotSupported_FeatureNotSupported: '0A000',
  InvalidTransactionInitiation_InvalidTransactionInitiation: '0B000',
  LocatorException_LocatorException: '0F000',
  LocatorException_InvalidLocatorSpecification: '0F001',
  InvalidGrantor_InvalidGrantor: '0L000',
  InvalidGrantor_InvalidGrantOperation: '0LP01',
  InvalidRoleSpecification_InvalidRoleSpecification: '0P000',
  DiagnosticsException_DiagnosticsException: '0Z000',
  DiagnosticsException_StackedDiagnosticsAccessedWithoutActiveHandler: '0Z002',
  CaseNotFound_CaseNotFound: '20000',
  CardinalityViolation_CardinalityViolation: '21000',
  DataException_DataException: '22000',
  DataException_StringDataRightTruncation: '22001',
  DataException_NullValueNoIndicatorParameter: '22002',
  DataException_NumericValueOutOfRange: '22003',
  DataException_NullValueNotAllowed: '22004',
  DataException_ErrorInAssignment: '22005',
  DataException_InvalidDatetimeFormat: '22007',
  DataException_DatetimeFieldOverflow: '22008',
  DataException_InvalidTimeZoneDisplacementValue: '22009',
  DataException_EscapeCharacterConflict: '2200B',
  DataException_InvalidUseOfEscapeCharacter: '2200C',
  DataException_InvalidEscapeOctet: '2200D',
  DataException_ZeroLengthCharacterString: '2200F',
  DataException_MostSpecificTypeMismatch: '2200G',
  DataException_SequenceGeneratorLimitExceeded: '2200H',
  DataException_NotAnXmlDocument: '2200L',
  DataException_InvalidXmlDocument: '2200M',
  DataException_InvalidXmlContent: '2200N',
  DataException_InvalidXmlComment: '2200S',
  DataException_InvalidXmlProcessingInstruction: '2200T',
  DataException_InvalidIndicatorParameterValue: '22010',
  DataException_SubstringError: '22011',
  DataException_DivisionByZero: '22012',
  DataException_InvalidPrecedingOrFollowingSize: '22013',
  DataException_InvalidArgumentForNtileFunction: '22014',
  DataException_IntervalFieldOverflow: '22015',
  DataException_InvalidArgumentForNthValueFunction: '22016',
  DataException_InvalidCharacterValueForCast: '22018',
  DataException_InvalidEscapeCharacter: '22019',
  DataException_InvalidRegularExpression: '2201B',
  DataException_InvalidArgumentForLogarithm: '2201E',
  DataException_InvalidArgumentForPowerFunction: '2201F',
  DataException_InvalidArgumentForWidthBucketFunction: '2201G',
  DataException_InvalidRowCountInLimitClause: '2201W',
  DataException_InvalidRowCountInResultOffsetClause: '2201X',
  DataException_CharacterNotInRepertoire: '22021',
  DataException_IndicatorOverflow: '22022',
  DataException_InvalidParameterValue: '22023',
  DataException_UnterminatedCString: '22024',
  DataException_InvalidEscapeSequence: '22025',
  DataException_StringDataLengthMismatch: '22026',
  DataException_TrimError: '22027',
  DataException_ArraySubscriptError: '2202E',
  DataException_InvalidTablesampleRepeat: '2202G',
  DataException_InvalidTablesampleArgument: '2202H',
  DataException_FloatingPointException: '22P01',
  DataException_InvalidTextRepresentation: '22P02',
  DataException_InvalidBinaryRepresentation: '22P03',
  DataException_BadCopyFileFormat: '22P04',
  DataException_UntranslatableCharacter: '22P05',
  DataException_NonstandardUseOfEscapeCharacter: '22P06',
  IntegrityConstraintViolation_IntegrityConstraintViolation: '23000',
  IntegrityConstraintViolation_RestrictViolation: '23001',
  IntegrityConstraintViolation_NotNullViolation: '23502',
  IntegrityConstraintViolation_ForeignKeyViolation: '23503',
  IntegrityConstraintViolation_UniqueViolation: '23505',
  IntegrityConstraintViolation_CheckViolation: '23514',
  IntegrityConstraintViolation_ExclusionViolation: '23P01',
  InvalidCursorState_InvalidCursorState: '24000',
  InvalidTransactionState_InvalidTransactionState: '25000',
  InvalidTransactionState_ActiveSqlTransaction: '25001',
  InvalidTransactionState_BranchTransactionAlreadyActive: '25002',
  InvalidTransactionState_InappropriateAccessModeForBranchTransaction: '25003',
  InvalidTransactionState_InappropriateIsolationLevelForBranchTransaction:
    '25004',
  InvalidTransactionState_NoActiveSqlTransactionForBranchTransaction: '25005',
  InvalidTransactionState_ReadOnlySqlTransaction: '25006',
  InvalidTransactionState_SchemaAndDataStatementMixingNotSupported: '25007',
  InvalidTransactionState_HeldCursorRequiresSameIsolationLevel: '25008',
  InvalidTransactionState_NoActiveSqlTransaction: '25P01',
  InvalidTransactionState_InFailedSqlTransaction: '25P02',
  InvalidTransactionState_IdleInTransactionSessionTimeout: '25P03',
  InvalidSqlStatementName_InvalidSqlStatementName: '26000',
  TriggeredDataChangeViolation_TriggeredDataChangeViolation: '27000',
  InvalidAuthorizationSpecification_InvalidAuthorizationSpecification: '28000',
  InvalidAuthorizationSpecification_InvalidPassword: '28P01',
  DependentPrivilegeDescriptorsStillExist_DependentPrivilegeDescriptorsStillExist:
    '2B000',
  DependentPrivilegeDescriptorsStillExist_DependentObjectsStillExist: '2BP01',
  InvalidTransactionTermination_InvalidTransactionTermination: '2D000',
  SqlRoutineException_SqlRoutineException: '2F000',
  SqlRoutineException_ModifyingSqlDataNotPermitted: '2F002',
  SqlRoutineException_ProhibitedSqlStatementAttempted: '2F003',
  SqlRoutineException_ReadingSqlDataNotPermitted: '2F004',
  SqlRoutineException_FunctionExecutedNoReturnStatement: '2F005',
  InvalidCursorName_InvalidCursorName: '34000',
  ExternalRoutineException_ExternalRoutineException: '38000',
  ExternalRoutineException_ContainingSqlNotPermitted: '38001',
  ExternalRoutineException_ModifyingSqlDataNotPermitted: '38002',
  ExternalRoutineException_ProhibitedSqlStatementAttempted: '38003',
  ExternalRoutineException_ReadingSqlDataNotPermitted: '38004',
  ExternalRoutineInvocationException_ExternalRoutineInvocationException:
    '39000',
  ExternalRoutineInvocationException_InvalidSqlstateReturned: '39001',
  ExternalRoutineInvocationException_NullValueNotAllowed: '39004',
  ExternalRoutineInvocationException_TriggerProtocolViolated: '39P01',
  ExternalRoutineInvocationException_SrfProtocolViolated: '39P02',
  ExternalRoutineInvocationException_EventTriggerProtocolViolated: '39P03',
  SavepointException_SavepointException: '3B000',
  SavepointException_InvalidSavepointSpecification: '3B001',
  InvalidCatalogName_InvalidCatalogName: '3D000',
  InvalidSchemaName_InvalidSchemaName: '3F000',
  TransactionRollback_TransactionRollback: '40000',
  TransactionRollback_SerializationFailure: '40001',
  TransactionRollback_TransactionIntegrityConstraintViolation: '40002',
  TransactionRollback_StatementCompletionUnknown: '40003',
  TransactionRollback_DeadlockDetected: '40P01',
  SyntaxErrorOrAccessRuleViolation_SyntaxErrorOrAccessRuleViolation: '42000',
  SyntaxErrorOrAccessRuleViolation_InsufficientPrivilege: '42501',
  SyntaxErrorOrAccessRuleViolation_SyntaxError: '42601',
  SyntaxErrorOrAccessRuleViolation_InvalidName: '42602',
  SyntaxErrorOrAccessRuleViolation_InvalidColumnDefinition: '42611',
  SyntaxErrorOrAccessRuleViolation_NameTooLong: '42622',
  SyntaxErrorOrAccessRuleViolation_DuplicateColumn: '42701',
  SyntaxErrorOrAccessRuleViolation_AmbiguousColumn: '42702',
  SyntaxErrorOrAccessRuleViolation_UndefinedColumn: '42703',
  SyntaxErrorOrAccessRuleViolation_UndefinedObject: '42704',
  SyntaxErrorOrAccessRuleViolation_DuplicateObject: '42710',
  SyntaxErrorOrAccessRuleViolation_DuplicateAlias: '42712',
  SyntaxErrorOrAccessRuleViolation_DuplicateFunction: '42723',
  SyntaxErrorOrAccessRuleViolation_AmbiguousFunction: '42725',
  SyntaxErrorOrAccessRuleViolation_GroupingError: '42803',
  SyntaxErrorOrAccessRuleViolation_DatatypeMismatch: '42804',
  SyntaxErrorOrAccessRuleViolation_WrongObjectType: '42809',
  SyntaxErrorOrAccessRuleViolation_InvalidForeignKey: '42830',
  SyntaxErrorOrAccessRuleViolation_CannotCoerce: '42846',
  SyntaxErrorOrAccessRuleViolation_UndefinedFunction: '42883',
  SyntaxErrorOrAccessRuleViolation_GeneratedAlways: '428C9',
  SyntaxErrorOrAccessRuleViolation_ReservedName: '42939',
  SyntaxErrorOrAccessRuleViolation_UndefinedTable: '42P01',
  SyntaxErrorOrAccessRuleViolation_UndefinedParameter: '42P02',
  SyntaxErrorOrAccessRuleViolation_DuplicateCursor: '42P03',
  SyntaxErrorOrAccessRuleViolation_DuplicateDatabase: '42P04',
  SyntaxErrorOrAccessRuleViolation_DuplicatePreparedStatement: '42P05',
  SyntaxErrorOrAccessRuleViolation_DuplicateSchema: '42P06',
  SyntaxErrorOrAccessRuleViolation_DuplicateTable: '42P07',
  SyntaxErrorOrAccessRuleViolation_AmbiguousParameter: '42P08',
  SyntaxErrorOrAccessRuleViolation_AmbiguousAlias: '42P09',
  SyntaxErrorOrAccessRuleViolation_InvalidColumnReference: '42P10',
  SyntaxErrorOrAccessRuleViolation_InvalidCursorDefinition: '42P11',
  SyntaxErrorOrAccessRuleViolation_InvalidDatabaseDefinition: '42P12',
  SyntaxErrorOrAccessRuleViolation_InvalidFunctionDefinition: '42P13',
  SyntaxErrorOrAccessRuleViolation_InvalidPreparedStatementDefinition: '42P14',
  SyntaxErrorOrAccessRuleViolation_InvalidSchemaDefinition: '42P15',
  SyntaxErrorOrAccessRuleViolation_InvalidTableDefinition: '42P16',
  SyntaxErrorOrAccessRuleViolation_InvalidObjectDefinition: '42P17',
  SyntaxErrorOrAccessRuleViolation_IndeterminateDatatype: '42P18',
  SyntaxErrorOrAccessRuleViolation_InvalidRecursion: '42P19',
  SyntaxErrorOrAccessRuleViolation_WindowingError: '42P20',
  SyntaxErrorOrAccessRuleViolation_CollationMismatch: '42P21',
  SyntaxErrorOrAccessRuleViolation_IndeterminateCollation: '42P22',
  WithCheckOptionViolation_WithCheckOptionViolation: '44000',
  InsufficientResources_InsufficientResources: '53000',
  InsufficientResources_DiskFull: '53100',
  InsufficientResources_OutOfMemory: '53200',
  InsufficientResources_TooManyConnections: '53300',
  InsufficientResources_ConfigurationLimitExceeded: '53400',
  ProgramLimitExceeded_ProgramLimitExceeded: '54000',
  ProgramLimitExceeded_StatementTooComplex: '54001',
  ProgramLimitExceeded_TooManyColumns: '54011',
  ProgramLimitExceeded_TooManyArguments: '54023',
  ObjectNotInPrerequisiteState_ObjectNotInPrerequisiteState: '55000',
  ObjectNotInPrerequisiteState_ObjectInUse: '55006',
  ObjectNotInPrerequisiteState_CantChangeRuntimeParam: '55P02',
  ObjectNotInPrerequisiteState_LockNotAvailable: '55P03',
  OperatorIntervention_OperatorIntervention: '57000',
  OperatorIntervention_QueryCanceled: '57014',
  OperatorIntervention_AdminShutdown: '57P01',
  OperatorIntervention_CrashShutdown: '57P02',
  OperatorIntervention_CannotConnectNow: '57P03',
  OperatorIntervention_DatabaseDropped: '57P04',
  SystemError_SystemError: '58000',
  SystemError_IoError: '58030',
  SystemError_UndefinedFile: '58P01',
  SystemError_DuplicateFile: '58P02',
  SnapshotTooOld_SnapshotTooOld: '72000',
  ConfigFileError_ConfigFileError: 'F0000',
  ConfigFileError_LockFileExists: 'F0001',
  FdwError_FdwError: 'HV000',
  FdwError_FdwOutOfMemory: 'HV001',
  FdwError_FdwDynamicParameterValueNeeded: 'HV002',
  FdwError_FdwInvalidDataType: 'HV004',
  FdwError_FdwColumnNameNotFound: 'HV005',
  FdwError_FdwInvalidDataTypeDescriptors: 'HV006',
  FdwError_FdwInvalidColumnName: 'HV007',
  FdwError_FdwInvalidColumnNumber: 'HV008',
  FdwError_FdwInvalidUseOfNullPointer: 'HV009',
  FdwError_FdwInvalidStringFormat: 'HV00A',
  FdwError_FdwInvalidHandle: 'HV00B',
  FdwError_FdwInvalidOptionIndex: 'HV00C',
  FdwError_FdwInvalidOptionName: 'HV00D',
  FdwError_FdwOptionNameNotFound: 'HV00J',
  FdwError_FdwReplyHandle: 'HV00K',
  FdwError_FdwUnableToCreateExecution: 'HV00L',
  FdwError_FdwUnableToCreateReply: 'HV00M',
  FdwError_FdwUnableToEstablishConnection: 'HV00N',
  FdwError_FdwNoSchemas: 'HV00P',
  FdwError_FdwSchemaNotFound: 'HV00Q',
  FdwError_FdwTableNotFound: 'HV00R',
  FdwError_FdwFunctionSequenceError: 'HV010',
  FdwError_FdwTooManyHandles: 'HV014',
  FdwError_FdwInconsistentDescriptorInformation: 'HV021',
  FdwError_FdwInvalidAttributeValue: 'HV024',
  FdwError_FdwInvalidStringLengthOrBufferLength: 'HV090',
  FdwError_FdwInvalidDescriptorFieldIdentifier: 'HV091',
  PlpgsqlError_PlpgsqlError: 'P0000',
  PlpgsqlError_RaiseException: 'P0001',
  PlpgsqlError_NoDataFound: 'P0002',
  PlpgsqlError_TooManyRows: 'P0003',
  PlpgsqlError_AssertFailure: 'P0004',
  InternalError_InternalError: 'XX000',
  InternalError_DataCorrupted: 'XX001',
  InternalError_IndexCorrupted: 'XX002'
};

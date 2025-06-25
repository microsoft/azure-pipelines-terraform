export class OpenTofuBaseCommandInitializer {
    public readonly name: string;
    public readonly workingDirectory: string;
    public readonly additionalArgs: string | undefined;

    constructor(
        name: string,
        workingDirectory: string,
        additionalArgs?: string | undefined
    ) {
        this.name = name;
        this.workingDirectory = workingDirectory;
        this.additionalArgs = additionalArgs;
    }
}

export class OpenTofuAuthorizationCommandInitializer extends OpenTofuBaseCommandInitializer {
    readonly serviceProvidername: string;

    constructor(
        name: string,
        workingDirectory: string,
        serviceProvidername: string,
        additionalArgs?: string | undefined
    ) {
        super(name, workingDirectory, additionalArgs);
        this.serviceProvidername = serviceProvidername;
    }
}
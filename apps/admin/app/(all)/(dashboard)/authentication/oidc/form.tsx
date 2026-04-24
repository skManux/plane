/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { isEmpty } from "lodash-es";
import Link from "next/link";
import { useForm } from "react-hook-form";
// plane internal packages
import { API_BASE_URL } from "@plane/constants";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IFormattedInstanceConfiguration, TInstanceOIDCAuthenticationConfigurationKeys } from "@plane/types";
// components
import { CodeBlock } from "@/components/common/code-block";
import { ConfirmDiscardModal } from "@/components/common/confirm-discard-modal";
import type { TControllerInputFormField } from "@/components/common/controller-input";
import { ControllerInput } from "@/components/common/controller-input";
import type { TControllerSwitchFormField } from "@/components/common/controller-switch";
import { ControllerSwitch } from "@/components/common/controller-switch";
import type { TCopyField } from "@/components/common/copy-field";
import { CopyField } from "@/components/common/copy-field";
// hooks
import { useInstance } from "@/hooks/store";

type Props = {
  config: IFormattedInstanceConfiguration;
};

type OIDCConfigFormValues = Record<TInstanceOIDCAuthenticationConfigurationKeys, string>;

export function InstanceOIDCConfigForm(props: Props) {
  const { config } = props;
  // states
  const [isDiscardChangesModalOpen, setIsDiscardChangesModalOpen] = useState(false);
  // store hooks
  const { updateInstanceConfigurations } = useInstance();
  // form data
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<OIDCConfigFormValues>({
    defaultValues: {
      OIDC_DISCOVERY_URL: config["OIDC_DISCOVERY_URL"] || "",
      OIDC_CLIENT_ID: config["OIDC_CLIENT_ID"] || "",
      OIDC_CLIENT_SECRET: config["OIDC_CLIENT_SECRET"] || "",
      OIDC_BUTTON_TEXT: config["OIDC_BUTTON_TEXT"] || "",
      OIDC_LOGO_URL: config["OIDC_LOGO_URL"] || "",
    },
  });

  const originURL = !isEmpty(API_BASE_URL) ? API_BASE_URL : typeof window !== "undefined" ? window.location.origin : "";

  const OIDC_FORM_FIELDS: TControllerInputFormField[] = [
    {
      key: "OIDC_DISCOVERY_URL",
      type: "text",
      label: "Discovery URL",
      description: (
        <>
          The OpenID Connect discovery endpoint. For Authentik, this is typically{" "}
          <CodeBlock darkerShade>https://your-authentik.example.com/application/o/slug/.well-known/openid-configuration</CodeBlock>
        </>
      ),
      placeholder: "https://your-provider.example.com/.well-known/openid-configuration",
      error: Boolean(errors.OIDC_DISCOVERY_URL),
      required: true,
    },
    {
      key: "OIDC_CLIENT_ID",
      type: "text",
      label: "Client ID",
      description: <>The client ID from your OIDC provider application settings.</>,
      placeholder: "your-client-id",
      error: Boolean(errors.OIDC_CLIENT_ID),
      required: true,
    },
    {
      key: "OIDC_CLIENT_SECRET",
      type: "password",
      label: "Client secret",
      description: <>The client secret from your OIDC provider application settings.</>,
      placeholder: "your-client-secret",
      error: Boolean(errors.OIDC_CLIENT_SECRET),
      required: true,
    },
    {
      key: "OIDC_BUTTON_TEXT",
      type: "text",
      label: "Login button text",
      description: (
        <>
          Custom text for the login button. Defaults to <CodeBlock darkerShade>Sign in with SSO</CodeBlock> if left
          empty.
        </>
      ),
      placeholder: "Sign in with Authentik",
      error: Boolean(errors.OIDC_BUTTON_TEXT),
      required: false,
    },
    {
      key: "OIDC_LOGO_URL",
      type: "text",
      label: "Logo URL",
      description: (
        <>
          URL of the logo to show on the login button. Leave empty to use a default icon.
        </>
      ),
      placeholder: "https://your-provider.example.com/logo.svg",
      error: Boolean(errors.OIDC_LOGO_URL),
      required: false,
    },
  ];

  const OIDC_FORM_SWITCH_FIELD: TControllerSwitchFormField<OIDCConfigFormValues> = {
    name: "OIDC_BUTTON_TEXT",
    label: "OIDC",
  };

  const OIDC_SERVICE_FIELD: TCopyField[] = [
    {
      key: "Callback_URI",
      label: "Callback URI",
      url: `${originURL}/auth/oidc/callback/`,
      description: (
        <>
          We will auto-generate this. Paste this into your OIDC provider&apos;s{" "}
          <CodeBlock darkerShade>Redirect URI</CodeBlock> or{" "}
          <CodeBlock darkerShade>Authorized Redirect URIs</CodeBlock> field.
        </>
      ),
    },
  ];

  const onSubmit = async (formData: OIDCConfigFormValues) => {
    const payload: Partial<OIDCConfigFormValues> = { ...formData };

    try {
      const response = await updateInstanceConfigurations(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Done!",
        message: "Your OIDC authentication is configured. You should test it now.",
      });
      reset({
        OIDC_DISCOVERY_URL: response.find((item) => item.key === "OIDC_DISCOVERY_URL")?.value,
        OIDC_CLIENT_ID: response.find((item) => item.key === "OIDC_CLIENT_ID")?.value,
        OIDC_CLIENT_SECRET: response.find((item) => item.key === "OIDC_CLIENT_SECRET")?.value,
        OIDC_BUTTON_TEXT: response.find((item) => item.key === "OIDC_BUTTON_TEXT")?.value,
        OIDC_LOGO_URL: response.find((item) => item.key === "OIDC_LOGO_URL")?.value,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoBack = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (isDirty) {
      e.preventDefault();
      setIsDiscardChangesModalOpen(true);
    }
  };

  return (
    <>
      <ConfirmDiscardModal
        isOpen={isDiscardChangesModalOpen}
        onDiscardHref="/authentication"
        handleClose={() => setIsDiscardChangesModalOpen(false)}
      />
      <div className="flex flex-col gap-8">
        <div className="grid w-full grid-cols-2 gap-x-12 gap-y-8">
          <div className="col-span-2 flex flex-col gap-y-4 pt-1 md:col-span-1">
            <div className="pt-2.5 text-18 font-medium">OIDC provider details for Plane</div>
            {OIDC_FORM_FIELDS.map((field) => (
              <ControllerInput
                key={field.key}
                control={control}
                type={field.type}
                name={field.key}
                label={field.label}
                description={field.description}
                placeholder={field.placeholder}
                error={field.error}
                required={field.required}
              />
            ))}
            <div className="flex flex-col gap-1 pt-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={(e) => void handleSubmit(onSubmit)(e)}
                  loading={isSubmitting}
                  disabled={!isDirty}
                >
                  {isSubmitting ? "Saving" : "Save changes"}
                </Button>
                <Link href="/authentication" className={getButtonStyling("secondary", "lg")} onClick={handleGoBack}>
                  Go back
                </Link>
              </div>
            </div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="flex flex-col gap-y-4 rounded-lg bg-layer-1 px-6 pt-1.5 pb-4">
              <div className="pt-2 text-18 font-medium">Plane-provided details for your OIDC provider</div>
              {OIDC_SERVICE_FIELD.map((field) => (
                <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

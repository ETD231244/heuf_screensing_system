"use client";

import { useState, useTransition } from "react";
import { saveProfile, uploadProfilePhoto } from "@/app/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { HELA_DISTRICTS, PNG_PROVINCES, llgsForDistrict } from "@/lib/constants";

export function ProfileForm({
  userId,
  email,
  hasPhoto,
  initial,
}: {
  userId: string;
  email: string;
  hasPhoto: boolean;
  initial: {
    givenName: string;
    surname: string;
    gender: string;
    dateOfBirth: string;
    age: string;
    phone: string;
    studentId: string;
    clanName: string;
    wardVillage: string;
    llgName: string;
    districtName: string;
    province: string;
  };
}) {
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoOk, setPhotoOk] = useState(hasPhoto);
  const [pending, start] = useTransition();
  const llgs = llgsForDistrict(values.districtName);

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      <Card>
        <CardBody className="flex flex-col items-center gap-3 text-center">
          <Avatar
            userId={userId}
            name={`${values.givenName} ${values.surname}`}
            hasPhoto={photoOk}
            size={112}
          />
          <p className="text-sm font-semibold text-[var(--huef-green-dark)]">
            {values.givenName} {values.surname}
          </p>
          <p className="text-xs text-[#6f675c]">{email}</p>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-[var(--huef-green)] px-4 text-sm font-semibold text-white">
            {photoOk ? "Replace photo" : "Upload photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const data = new FormData();
                data.set("photo", file);
                setError(null);
                start(async () => {
                  const result = await uploadProfilePhoto(data);
                  if (result && "error" in result) {
                    setError(result.error ?? "Could not upload that photograph.");
                    return;
                  }
                  setPhotoOk(true);
                  setMessage(result.message ?? "Photograph uploaded.");
                });
                event.target.value = "";
              }}
            />
          </label>
          <p className="text-xs text-[#6f675c]">JPG or PNG, up to 2 MB. A default avatar is shown until you upload a photo.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {error ? <Alert tone="error">{error}</Alert> : null}
          {message && !error ? <Alert tone="success">{message}</Alert> : null}
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              setError(null);
              start(async () => {
                const result = await saveProfile(data);
                if (result && "error" in result) {
                  setError(result.error ?? "Could not save your profile.");
                  return;
                }
                setMessage(result.message ?? "Profile updated.");
              });
            }}
          >
            <Field label="Given name" htmlFor="givenName" required>
              <Input id="givenName" name="givenName" defaultValue={values.givenName} className="uppercase" placeholder="e.g. John T." />
            </Field>
            <Field label="Surname" htmlFor="surname" required>
              <Input id="surname" name="surname" defaultValue={values.surname} className="uppercase" placeholder="e.g. Doe" />
            </Field>
            <Field label="Gender" htmlFor="gender" required>
              <Select id="gender" name="gender" defaultValue={values.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </Select>
            </Field>
            <Field label="Date of birth" htmlFor="dateOfBirth" required>
              <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={values.dateOfBirth} />
            </Field>
            <Field label="Phone number" htmlFor="phone" required hint="e.g. +675 7XX XXX XX">
              <Input id="phone" name="phone" defaultValue={values.phone} placeholder="e.g. +675 7XX XXX XX" />
            </Field>
            <Field label="Student ID" htmlFor="studentId" optional hint="If your institution has already issued one.">
              <Input id="studentId" name="studentId" defaultValue={values.studentId} placeholder="Student ID Number" />
            </Field>
            <Field label="District" htmlFor="districtName" required>
              <Select
                id="districtName"
                name="districtName"
                value={values.districtName}
                onChange={(e) => {
                  set("districtName", e.target.value);
                  set("llgName", "");
                }}
              >
                <option value="">Select your district</option>
                {HELA_DISTRICTS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="LLG" htmlFor="llgName" required>
              <Select id="llgName" name="llgName" value={values.llgName} onChange={(e) => set("llgName", e.target.value)}>
                <option value="">Select your LLG</option>
                {llgs.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ward / village" htmlFor="wardVillage" required>
              <Input id="wardVillage" name="wardVillage" defaultValue={values.wardVillage} placeholder="Enter your ward or village" className="uppercase" />
            </Field>
            <Field label="Clan name" htmlFor="clanName" optional>
              <Input id="clanName" name="clanName" defaultValue={values.clanName} placeholder="e.g. Huli" className="uppercase" />
            </Field>
            <Field label="Province" htmlFor="province">
              <Select id="province" name="province" defaultValue={values.province}>
                {PNG_PROVINCES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                Save profile
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

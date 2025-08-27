import { is } from "drizzle-orm";
import React from "react";

interface AnimalDetailsProps {
  announceNumber: string;
  announcementDate: string;
  description: string;
  foundLocation: string;
  center: string;
  isSubscriber?: boolean;
  specialNotes?: string;
}

export default function AnimalDetails({
  announceNumber,
  announcementDate,
  description,
  foundLocation,
  center,
  isSubscriber = false,
  specialNotes,
}: AnimalDetailsProps) {
  return (
    <div className="bg-white rounded-lg mx-4">
      <table className="w-full text-sm">
        <tbody>
          {!isSubscriber && (
            <>
              <tr className="h-8">
                <td className="text-gr h5 py-1 pr-3 align-top w-30">
                  공고번호
                </td>
                <td className="text-sm py-1">
                  <div>{announceNumber ? announceNumber : "-"}</div>
                </td>
              </tr>
              <tr className="h-8">
                <td className="text-gr h5 py-1 pr-3 align-top w-30">
                  공고기간
                </td>
                <td className="text-sm py-1">
                  <div>{announcementDate ? announcementDate : "-"}</div>
                </td>
              </tr>
            </>
          )}
          {isSubscriber && (
            <>
              {specialNotes && (
                <tr className="h-8">
                  <td className="text-gr h5 py-1 pr-3 align-top w-20">
                    상세 특이사항
                  </td>
                  <td className="text-sm py-1">
                    <div>{specialNotes}</div>
                  </td>
                </tr>
              )}
            </>
          )}
          <tr className="h-8">
            <td className="text-gr h5 py-1 pr-3 align-top w-30">특이사항</td>
            <td className="text-sm py-1">
              <div>{description}</div>
            </td>
          </tr>
          <tr className="h-8">
            <td className="text-gr h5 py-1 pr-3 align-top w-30">발견장소</td>
            <td className="text-sm py-1">
              <div>{foundLocation}</div>
            </td>
          </tr>
          {!isSubscriber && (
            <tr className="h-8">
              <td className="text-gr h5 py-1 pr-3 align-top w-30">관할기관</td>
              <td className="text-sm py-1">
                <div>{center}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
